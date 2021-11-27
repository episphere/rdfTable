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
    // read rdf source
    if(document.location.search.length>2){
        await rdfTable.readRDF()
        console.log(`json extracted from ${rdfTable.url}:`,rdfTable.json)
    }
}

rdfTable.readRDF = async (url=document.location.search.slice(1))=>{
    let txt = await (await fetch(url)).text()
    rdfTable.url=url
    return rdfTable.rdf2json(txt)
}

rdfTable.rdf2json = txt =>{ // rdf as txt
    let rdf={}
    // read document head
    //let txtHead = txt.match(/<rdf:RDF[^>]+>/)[0].slice(9).split(/\s/)
    let txtHead = txt.match(/<rdf:RDF[^>]+>/)[0]
    let nHead=txtHead.length
    txtHead=txtHead.slice(9).split(/\s/)
    rdf.xmlns={}
    txtHead.forEach(h=>{
        h = h.split('=')
        h[0]=h[0].replace('xmlns:','')
        rdf.xmlns[h[0]]=h[1].replace(/"/g,'').replace(/[#>\/]+$/,'')
    })
    // read document body, one entry/row at a time
    let txtBody = txt.slice(nHead+1).match(/^([^Ĭ]*)<\/rdf:RDF>$/)[1]
    txtBody=txtBody.split(/\n/)
    //deblank txtBody tail
    txtBody[txtBody.length-1]=txtBody[txtBody.length-1].replace(/<[^>]+>$/,'')
    //debugger
    let rowID
    rdf.rows=[]
    txtBody.forEach(l=>{ // for each line
        l=l.replace(/<\/dsbase:[^>]+>$/,'') // clear tail
        if(l[0]!=' '){ //new row
            let L=l.match(/<dsbase:([^\s]+) rdf:about="([^\s>"]+)/)
            rowID=L[2]
            rdf.rows[rowID]={
                about:{resourceID:L[1]}
            }
        }else{
            rowID
            if(l.match(/>/g).length==2){
                let L = l.match(/\s+<([^>]+)>([^<]+)</)
                //debugger
                rdf.rows[rowID][L[1]]=L[2]
                //rdf.rows[rowID][L[1]]=L[2]
            }else{
                l=l.replace(/<\/dsbase:[^>]+>$/,'')
                let L = l.match(/^\s+<([\S]+)\s([^>]+)/)
                //debugger
                L[2]=L[2].replace(/\/$/,'')
                rdf.rows[rowID][L[1]]=rdf.rows[rowID][L[1]]||[]
                rdf.rows[rowID][L[1]].push(L[2])
                
            }
            //debugger
        }
    })
    rdfTable.json=rdf
    return rdf
}





rdfTable()