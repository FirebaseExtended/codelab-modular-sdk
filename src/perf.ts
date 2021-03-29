/**
 * Copyright 2021 Google LLC. All Rights Reserved.
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
export function logPerformance() {
    if (!performance) return;
    performance.getEntries().forEach(entry => {

      if (entry.entryType === 'navigation' || entry.entryType === 'paint') {
        return;
      }
      
      let label = entry.name;
      let time = entry.duration;
       if (entry.entryType === 'resource') {
        if (entry.name.includes('googleapis')) {
          return;
        } else {
          const parts = entry.name.split('/');
          label = 'resource: ' + parts[parts.length - 1];
        }
      }
      console.log(label, Math.round(time));
    });
  }
