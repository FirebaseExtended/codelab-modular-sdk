export function logPerformance() {
    if (!performance) return;
    performance.getEntries().forEach(entry => {
      let label = entry.name;
      let time = entry.duration
      let navStart = 0;
      if (entry.entryType === 'navigation') {
        label = 'loadEventEnd';
        navStart = entry.startTime;
      } else if (entry.entryType === 'resource') {
        if (entry.name.includes('googleapis')) {
          label = 'Firestore channel';
        } else {
          const parts = entry.name.split('/');
          label = 'resource: ' + parts[parts.length - 1];
        }
      } else if (entry.entryType === 'paint') {
        time = entry.startTime - navStart;
      }
      console.log(label, Math.round(time));
    });
  }