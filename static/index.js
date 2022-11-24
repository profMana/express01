"use strict"
$(document).ready(function() {
	
	let div = $("div")

    $("#btnGet").on("click", function() {
        let request = inviaRichiesta("GET", "/api/richiesta1", { "nome": "Aurora" });
        request.done(function(data) {
           div.empty()
		   div.text(JSON.stringify(data))
        });
        request.fail(errore)
    });

    $("#btnPost").on("click", function() {
        let request = inviaRichiesta("PATCH", "/api/richiesta2", {"nome": "Unico", "nVampiri": 3});
        request.done(function(data) {
           div.empty()
		   div.text(JSON.stringify(data))
        });
        request.fail(errore)
    });

    $("#btnParams").on("click", function() {
        let request = inviaRichiesta("GET", "/api/richiestaParams/m/brown");
        request.done(function(data) {
           div.empty()
		   for(let item of data) 
			 $("<div>").text(JSON.stringify(item)).appendTo(div)
        });
        request.fail(errore)
    });

});