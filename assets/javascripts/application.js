/*
forked from
http://davidsulc.github.com/backbone.marionette-collection-example/
*/

//Backbone.emulateHTTP = true
//Backbone.emulateJSON = true

function changeProperty(obj,propname,by) {
	if( typeof by === "undefined" ) by = 1
	console.log("changeProperty("+obj+", "+propname +", "+by+")");
	obj.set(propname, obj.get(propname) + by);
	obj.save();
	return obj; }

function makeChangeProperty(propname,by) {
	return function(){
		changeProperty(this,propname,by); }}

function inc(obj,propname,by){
	if( typeof by === "undefined" ) 
		by = 1;
	return changeProperty(obj,propname,by); }

function makePropertyIncrementer(propname,by) {
	return function (obj){
		return inc(obj,propname,by)}}


function dec(obj,propname){
	return inc(obj,propname,-1); }

function rankUp() {
	return this.inc("rank",-1); }

function rankDown () {
	return this.inc("rank",1); }

function addValidator(fn1,validateFn){
	return function(){
		if(validateFn(this))
			return fn1(this);
		return this;
	}
}

MyApp = new Backbone.Marionette.Application();

var CustomLayout = Backbone.Marionette.Layout.extend({
	onRender: function () {
      // get rid of that pesky wrapping-div // assumes 1 child element.
      this.$el = this.$el.children();
      this.setElement(this.$el);
	}
});

MyApp.addRegions({
  mainRegion: "#content"
});


Food = Backbone.Model.extend({

	idAttribute : "Id", //uppercase coming from Go lang publicly accessible struct field

	defaults: {
		votes: 0,
		id: 0,
		rank: 1
	},
  
  addVote: makePropertyIncrementer("votes",1),
  /*addVote: function(){ this.set('votes', this.get('votes') + 1); this.save(); }, */
  rankUp:   addValidator(makePropertyIncrementer("rank", -1),function(){
		console.log("in rankUp, this = " + this);
		this.get("rank") >1}),
  rankDown: addValidator(makePropertyIncrementer("rank",1), 
		function(){this.get("rank") < this.collection.size()}),
	
});

Foods = Backbone.Collection.extend({
  model: Food,
  url: "http://localhost:8080/simple-service/foods",

  initialize: function(items){
	/* _.each(items, function(item) { item.set('rank', rank); ++rank; }); */
    var rank = 1;
    
    this.on('add', function(item){
      if( ! item.get('rank') ){
			//changed here
			item.set('rank',1) ;
			//var error =  Error("Cat must have a rank defined before being added to the collection"); //error.name = "NoRankError"; //throw error;
      }
    });
    
    var self = this;

    MyApp.vent.on("rank:up", function(item){
      if (item.get('rank') == 1) {
        // can't increase rank of top-ranked cat
        return true;
      }
      self.rankUp(item);
      self.sort();
    });

    MyApp.vent.on("rank:down", function(item){
      if (item.get('rank') == self.size()) {
        // can't decrease rank of lowest ranked cat
        return true;
      }
      self.rankDown(item);
      self.sort();
    });
    
    MyApp.vent.on("item:del", function(item){
      var disqualifiedRank = item.get('rank');
      var itemsToUprank = self.filter(
        function(item){ return item.get('rank') > disqualifiedRank; }
      );
      itemsToUprank.forEach(function(item){
        item.rankUp();
      });
      self.trigger('reset');
    });
  },

  comparator: function(item) {
    return item.get('rank');
  },
  
  rankUp: function(item) {
    // find the cat we're going to swap ranks with
    var rankToSwap = item.get('rank') - 1;
    var otherItem = this.at(rankToSwap - 1);
    
    // swap ranks
    item.rankUp();
    otherItem.rankDown();
  },
  
  rankDown: function(item) {
    // find the cat we're going to swap ranks with
    var rankToSwap = item.get('rank') + 1;
    var otherItem = this.at(rankToSwap - 1);
    
    // swap ranks
    item.rankDown();
    otherItem.rankUp();
  }
});

// no worky worky AngryCatView = CustomLayout.extend({
FoodView = Backbone.Marionette.ItemView.extend({
  template: "#entry-template",
  tagName: 'tr',
  className: 'food',
  
  events: {
    'click .rank_up img': 'rankUp',
    'click .rank_down img': 'rankDown',
    'click a.del': 'del'
  },
  
  initialize: function(){
    this.listenTo(this.model, "change:votes", this.render);
  },
  
  rankUp: function(){
    this.model.addVote();
    MyApp.vent.trigger("rank:up", this.model);
  },
  
  rankDown: function(){
    this.model.addVote();
    MyApp.vent.trigger("rank:down", this.model);
  },
  
  del: function(){
    MyApp.vent.trigger("food:del", this.model);
    this.model.destroy();
  }
});

FoodsView = Backbone.Marionette.CompositeView.extend({
  tagName: "table",
  id: "foods",
  className: "table-striped table-bordered",
  template: "#entries-template",
  itemView: FoodView,
  
  initialize: function(){
    this.listenTo(this.collection, "sort", this.renderCollection);
  },
  
  appendHtml: function(collectionView, itemView){
    collectionView.$("tbody").append(itemView.el);
  }
});

MyApp.addInitializer(function(options){
  var foodsView = new FoodsView({
    collection: options.foods
  });
  MyApp.mainRegion.show(foodsView);
});

$(document).ready(function(){
  var foods = new Foods([ ]);
	foods.fetch( {
		success: function(collection, response,options) {
			//console.log("success got collection, response, options ", collection, response, options)
			_.each(collection.models, function(model) {
				foods.add( new Food( model ) );
			})
		},
		error: function(collection,response,options) {
			//console.log("error got collection ", collection ) console.log("error got response ",  response ) console.log("error got options ",  options)
		},

		complete: function(xhr, textStatus, errorThrown) {
			//console.log("complete handler, xhr " + xhr +", textStatus " + textStatus +", err "+ errorThrown);
		}
	});

  MyApp.start({foods: foods});
  
});
