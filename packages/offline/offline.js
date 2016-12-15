var localStores = {};



OfflineColCache = {
    Collection: function (name) {
        var collection = new Meteor.Collection(name);
        if (!localStores[name])
            localStores[name] = localForage.createInstance({
                name: "UltiSite",
                _id: name
            });
        // load data from offline store
        localTournamentStore.iterate(function (elem, key) {
            if (!collection.findOne(elem._id));
            collection.insert(elem);
        });
        collection.observe({
            changed: function (_id, doc) {
                localTournamentStore.setItem(_id, doc);
            },
            added: function (_id, doc) {
                localTournamentStore.setItem(_id, doc);
            },
        });
        return collection;
    }
};