import $ from 'jquery';
import Backbone from 'backbone';

let projectsCollection = Backbone.Collection.extend({
    initialize() {
        console.log("Testing Backbone");
        $('body').css('background-color', 'blue');
    }
});

let projectModel = Backbone.Model.extend({

});

let projectsView = Backbone.View.extend({
    initialize(container, collection) {
        this.container = container;
        this.collection = collection;
    }
});

let projects = new projectsCollection();