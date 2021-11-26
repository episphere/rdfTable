console.log(`loading rdfTable.js at ${Date()}`)

rdfTable=function(){ //
    rdfTable.div=document.getElementById('rdfTable')
    if(rdfTable.div){
        rdfTable.ui(rdfTable.div)
    }
}

/**
 * Assembles RDF table in DOM element.
 * @param {object} div - a DOM element, ideally a div, where table UI is to be assembled. It can also be the id of the DOM element.
*/
rdfTable.ui = async function(div=rdfTable.div){ // assemble UI
    if(typeof(div)=='string'){ // if the id of the dom element is being passed as the input argument
        div=document.getElementById(div)
    }
    debugger
}





rdfTable()