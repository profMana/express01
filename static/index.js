"use strict"
$(document).ready(function() {

    $("#btnGet").on("click", function() {
        let request = inviaRichiesta("GET", "/api/richiesta1", { "nome": "Aurora" });
        request.done(function(data) {
            console.log(data);
        });
        request.fail(errore)
    });

    $("#btnPost").on("click", function() {
        let request = inviaRichiesta("PATCH", "/api/richiesta2", {"nome": "Unico", "nVampiri": 3});
        request.done(function(data) {
            console.log(data);
        });
        request.fail(errore)
    });

    $("#btnParams").on("click", function() {
        let request = inviaRichiesta("GET", "/api/richiestaParams/m/brown");
        request.done(function(data) {
            console.log(data);
        });
        request.fail(errore)
    });

});