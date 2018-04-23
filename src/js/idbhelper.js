import idb from 'idb';

class IDBHelper {
  
  static get store() {
    let store = {};
    return store;
  }

  static openIDB() {
    console.log('openIDB');
    return idb.open('mws-restaurants', 1, function(upgradeDB) {
      this.store = upgradeDB.createObjectStore(
        'keyval', 
        {keyPath: 'id'});
    });
  }

  static insertIDB(data) {
    return this.openIDB();
  }

}