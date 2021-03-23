/**
 * Copyright 2021 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const admin = require('firebase-admin');
const functions = require('firebase-functions');

admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

exports.updateTest = functions.https.onRequest(async (request, response) => {
  const stockMap = {};
  const cSnap = await admin.firestore().collection('historical').get();
  const batch = admin.firestore().batch();
  cSnap.forEach(docSnap => {
    const symbol = docSnap.id;
    if (!docSnap.data()) { return; }
    const dataPoint = docSnap.data().timeSeries[request.query.index || 0];
    stockMap[symbol] = dataPoint;
    const ref = admin.firestore().doc(`current/${symbol}`);
    batch.set(ref, stockMap[symbol]);
    if (Object.keys(stockMap).length === cSnap.size) {
        batch.commit();
        response.send('ok');
    }
  });
});

exports.updateStocks = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
  const stockMap = {};
  const currentDataRef = admin.firestore().doc('metadata/currentData');
  const currentDataSnap = await currentDataRef.get();
  let { index, maxIndex } = currentDataSnap.data();
  if (!index) {
    index = 1;
  }
  const cSnap = await admin.firestore().collection('historical').get();
  const batch = admin.firestore().batch();
  let numSymbolsToUpdate = cSnap.size;
  cSnap.forEach(docSnap => {
    const symbol = docSnap.id;
    if (!docSnap.data()) { return; }
    const dataPoint = docSnap.data().timeSeries[index];
    const previousDataPoint = docSnap.data().timeSeries[index - 1];
    if (!dataPoint || !previousDataPoint) {
      console.log(`Couldn't get data for ${symbol} at index ${index}`);
      numSymbolsToUpdate--;
      return;
    }
    const delta = dataPoint.closeValue - previousDataPoint.closeValue;
    stockMap[symbol] = Object.assign({ delta }, dataPoint);
    const ref = admin.firestore().doc(`current/${symbol}`);
    batch.set(ref, stockMap[symbol]);
    if (Object.keys(stockMap).length >= numSymbolsToUpdate) {
      let newIndex = index + 1;
      if (newIndex > maxIndex) {
        newIndex = 1;
      }
      batch.update(currentDataRef, { index: newIndex });
      batch.commit();
    }
  });
});
