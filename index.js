/**
 * Import all the things.
 */
import $ from 'jquery';
import Backbone from 'backbone';
import fontawesome from '@fortawesome/fontawesome';
import solid from '@fortawesome/fontawesome-pro-solid';

/**
 * Globals aren't always bad.
 */
let projects, view, config, firstrun = true;

/**
 * @class projectModel
 * @extends Backbone.Model
 */
let projectModel = Backbone.Model.extend({
    idAttribute: 'project_folder',
    url: function() {
        return config.feed_url + "/search?project_folder="+this.id;
    }
});

/**
 * @class projectsCollection
 * @extends Backbone.Collection
 */
let projectsCollection = Backbone.Collection.extend({
    url: config.feed_url,
    idAttribute: 'project_folder',
    model: projectModel,

    load: function (callback) {
        this.reset();
        this.fetch({success: callback});
    },
});

/**
 * @class projectsView
 * @extends Backbone.View
 */
let projectsView = Backbone.View.extend({
    initialize(container, collection) {
        this.container = container;
        this.collection = collection;
    },
    
    render() {
        let self = this;

        let output = '';
        self.collection.each(function(row) {
            output += `<tr class="datarow" id="row-${row.project_folder}">`;
                config.table.columns.forEach(function(column) {
                    output += `<td width="${column.width}%">`;
                    switch (column.treatment) {
                        case "text":
                            output += row.attributes[column.id];
                        break;
                        case "image":
                            output += self.renderImage(column, row);
                        break;
                        case "progressbar":
                            output += self.renderProgress(column, row);
                        break;
                        case "icon":
                            output += self.renderIcons(column, row);
                        break;
                    }
                    output += "</td>";
                })
            output += '</tr>';
        });

        self.container.html(output);
        $('table').fadeIn()
    },

    renderImage(column, row) {
        let urlchunks = column.location.split("@@");
        let thereturn = '';
        if (Array.isArray(column.id)) {
            column.id.forEach(function(singleID) {
                if (row.attributes[singleID] !== '') thereturn += `<img src="${urlchunks[0] + row.attributes[singleID] + urlchunks[1]}" class="userimg"/>`;
            });
        } else {
            thereturn += `<img src="${urlchunks[0] + row.attributes[column.id] + urlchunks[1]}" class="userimg"/>`;
        }
        return thereturn;
    },

    renderProgress(column, row) {
        let total = 1;
        let amount = 0;
        if (Array.isArray(column.id)) {
            total = column.id.length;
            column.id.forEach(function (singleID) {
                if (row.attributes[singleID] !== '') {
                    amount++;
                }
            });
        }
        total = parseInt(amount/total*100);
        return `<div class="progress"><div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="${total}" aria-valuemin="0" aria-valuemax="100" style="width: ${total}%"></div></div>`;
    },

    renderIcons(column, row) {
        let thereturn = '';
        if (Array.isArray(column.id)) {
            column.id.forEach(function(singleID) {
                if (row.attributes[singleID] !== '') thereturn += fontawesome.icon({prefix: 'fas', iconName: config.table.icons[row.attributes[singleID]].icon}).html[0];
            });
        } else {
            thereturn += fontawesome.icon({prefix: 'fas', iconName: config.table.icons[row.attributes[column.id]].icon}).html[0];
        }
        return thereturn;
    }
});

class MGStatusBoard {
    constructor() {
        let self = this;
        fetch("./config/config.json")
            .then(response => response.json())
            .then(json => {
                config = json;
                this.init();
            })
            .catch(err => alert("Config data could not be loaded. " + err));
    }

    init() {
        projects = new projectsCollection();
        view = new projectsView($('#projects tbody'), projects);
        $('header, table').hide();

        fontawesome.library.add(solid);
        this.startTime();
        this.fetchWeather();
        this.fetchProjects();
        this.renderLegend();

        $('#logo img').prop('src', config.logo);
        $('#logo span').html(config.title);
    }

    checkTime(i) {
        if (i < 10) return i = "0" + i;
        return i;
    }

    startTime() {
        let self = this;

        let today = new Date();
        let h = today.getHours();
        let m = self.checkTime(today.getMinutes());
        $('#time').html(h + ":" + m);

        let t = setTimeout(function () {
            self.startTime();
        }, 1000);
    }

    fetchWeather() {
        let self = this;
        let weather = $('#weather');
        fetch(`http://api.wunderground.com/api/${config.weather.api_key}/conditions/q/${config.weather.location}.json`)
            .then(response => response.json())
            .then(data => {
                weather.find('.icon').prop('src', data.current_observation.icon_url);
                weather.find('.temp').html(parseInt(data.current_observation.temp_c));
                if (firstrun) {
                    $('header').fadeIn(500);
                    firstrun = false;
                }
            });

        let t = setTimeout(function () {
            self.fetchWeather();
        }, 60 * 60 * 1000);
    }

    fetchProjects() {
        let self = this;
        projects.load(view.render.bind(view));

        let t = setTimeout(function () {
            self.fetchProjects();
        }, 60 * 5 * 1000);
    }

    renderLegend() {
        let output = 'Legend: &nbsp;';
        let keys = Object.keys(config.table.icons);
        keys.forEach(item => {
            output += "<span>";
            output += fontawesome.icon({prefix: 'fas', iconName: config.table.icons[item].icon}).html[0];
            output += config.table.icons[item].name;
            output += "</span>";
        });

        $('#legend').html(output);
    }

}

$(function () {
    new MGStatusBoard();
});