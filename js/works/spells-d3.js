/**
 * @author Kate Compton
 */

var app = {};
$(document).ready(function() {

    var spellbook = {
        adventure : "lament story epic tear sight sigh wish desire dance mystery enigma drama path training sorrows joy tragedy comedy riddle puzzle regret victory loss song adventure question quest vow oath tale travel".split(" "),
        animal : "amoeba mongoose capybara yeti dragon unicorn sphinx kangaroo boa nematode sheep quail goat corgi agouti zebra giraffe rhino skunk dolphin whale bullfrog okapi sloth monkey orangutan grizzly moose elk dikdik ibis stork finch nightingale goose robin eagle hawk iguana tortoise panther lion tiger gnu reindeer raccoon opossum".split(" "),
        mood : "angry bemused elated skeptical morose gleeful curious sleepy hopeful ashamed alert energetic exhausted giddy grateful groggy grumpy irate jealous jubilant lethargic sated lonely opportunistic relaxed restless surprised tired thankful".split(" "),
        building : "temple hall mines fortress sanctuary castle monestary abbey palace mausoleum".split(" "),
        noun : "wind arrow sky ice hexagram circle temple blood iron gold storm wolf mountain river north east south west earth forest stone sword".split(" "),
        verb : "confess betray entangle ensnare awaken detect discern desecrate restore summon espy".split(" "),
        title : ["#noun# of the #mood# #noun#", "To #verb# the #noun# of #noun#"],
        ingredient : ["the #animalPart# of #animal.a#"],
        animalPart : ["talon", "wing", "egg", "claw", "shinbone", "eye", "tongue", "down", "fur", "feather"],
        ingredientSource : ["in the #building# of the #noun#"],
        gatherIngredients : ["#ingredientSource.capitalize#, gather #ingredient1#.<p>#ingredientSource.capitalize#, gather #ingredient2#.<p>#ingredientSource.capitalize#, gather #ingredient3#."],
        mixIngredients : ["Mix #ingredient1# with #ingredient2#."],

        origin : ["<h2>#title.capitalizeAll#</h2><a href='http://www.xkcd.com'>hello</a><p>[ingredient1:#ingredient#][ingredient2:#ingredient#][ingredient3:#ingredient#]#gatherIngredients# #mixIngredients# [ingredient1:POP][ingredient2:POP][ingredient3:POP]</p>"]
    };

    var testGrammar = {
        animal : "amoeba mongoose capybara yeti dragon unicorn sphinx kangaroo boa nematode sheep quail goat corgi agouti zebra giraffe rhino skunk dolphin whale bullfrog okapi sloth monkey orangutan grizzly moose elk dikdik ibis stork finch nightingale goose robin eagle hawk iguana tortoise panther lion tiger gnu reindeer raccoon opossum".split(" "),
        "emotion" : "happy sad reflective morose gleeful jealous resentful appreciative proud".split(" "),
        "name" : "Jamal Aisha Marcel Pearl Gertrude Bailey Logan Aiden Scout Ambrose Beverly Takashi Hilda Nadya Salim Carmen Ming Lakshmi Naveen Ginger".split(" "),
        "placeAdj" : "delightful haunted faraway sunlit magical enchanted serene scenic".split(" "),
        "place" : "lagoon lake forest island grotto mountain desert wasteland meadow river".split(" "),
        "story" : ["Once #mainCharacter# went on an adventure to the #placeAdj.capitalize# #destination.capitalize#. Seeing such a #placeAdj# #destination# made #mainCharacter# #emotion#."],
        "origin" : ["[mainCharacter:#name# the #animal.capitalize#][destination:#place#]#story#[mainCharacter:pop]"],
    };

    console.log(JSON.stringify(testGrammar));

    var story_pieces = [];

    function RotatePoint(x,y,angle,c_x,c_y) {

        var s = Math.sin(angle * (Math.PI/180));
        var c = Math.cos(angle * (Math.PI/180));
        
        x -= c_x;
        y -= c_y;

        var x_rot = (x * c) - (y * s);
        var y_rot = (x * s) + (y * c);

        x = c_x + x_rot;
        y = c_y + y_rot;

        return [x, y];
    };

    //http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
    function getRandomColor() {
        var letters = '6789ABC'.split('');
        //var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 7)];
        }
        return color;
    }
    
    /*
    var adventure = function(node){
        console.log(node);
        console.log(app.grammar.sourceRules);
        //new_trace = app.grammar.createTraceFromSymbol(node.symbol);
        //new_trace.expand();
        //console.log(new_trace.flatten());
    }*/

    var retrieve = function(node){
        for (var i = 0; i < node.children.length; i++) {
            if (node.children[i].type === "plainText"){
                story_pieces.push(node.children[i].flatten());
            } else {
                retrieve(node.children[i]);
                adventure(node.children[i]);
            }
        }
    }
    var count = 1;
    var traces = [];
    app.grammar = tracery.createGrammar(testGrammar);

    var holder = $("#spells");

    var tree = d3.select("#tree");

    for (var i = 0; i < count; i++) {
        traces[i] = app.grammar.createTraceFromSymbol();
        traces[i].expand();      

        var story = traces[i].root.flatten();
        holder.append("<p>" + story + "</p>");

        //var x_loc = parseInt(tree.style("width"), 10) / 2;
        x_loc = 10;
        var y_loc = parseInt(tree.style("height"), 10) / 2;

        //tree.append("text")
        //    .attr("x", x_loc)
        //    .attr("y", y_loc)
        //    .text(story);

        retrieve(traces[i].root);

        for (var piece in story_pieces){

            var rot_angle = Math.random() * 20 - 10;
            var colour = getRandomColor();
            tree.append("text")
                .attr("class", "piece")
                .attr("id", story_pieces[piece])
                .attr("x", x_loc)
                .attr("y", y_loc)
                .attr("transform", "rotate(" + rot_angle + "," + x_loc + "," + y_loc + ")")
                .attr("font-family", "serif")
                .attr("font-size", "20px")
                .attr("fill", colour)
                .text(story_pieces[piece]);

            var last_width = 0;
            var last_height = 0;
            var last_x = x_loc;
            var last_y = y_loc;

            tree.selectAll(".piece").each(function() {
                last_width = this.getBBox().width;
                last_height = this.getBBox().height;
            });   

            var new_loc = RotatePoint(x_loc + last_width, y_loc, rot_angle, x_loc, y_loc);

            /*tree.append("circle")
                .attr("cx", x_loc)
                .attr("cy", y_loc)
                .attr("r", 2);

            tree.append("circle")
                .attr("cx", new_loc[0])
                .attr("cy", new_loc[1])
                .attr("r", 2);*/

             
            //x_loc += last_width + 5;
            x_loc = new_loc[0] + 5;
            y_loc = new_loc[1];
        }
    }
    //.attr("transform", "rotate(0," + x_loc + "," + y_loc + ")")
    //   storygami.createTree($("#stories"), traces[0]);

});

