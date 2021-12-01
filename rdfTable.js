console.log(`loading rdfTable.js at ${Date()}`)

rdfTable=function(){ //
    rdfTable.div=document.getElementById('rdfTableDiv')
    if(rdfTable.div&&location.search.length>1){
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
    // tabulate
    rdfTable.tabulate()
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

rdfTable.tabulate=function(div=document.getElementById("rdfTableDiv")){
    if(typeof(div)=="string"){
        div=document.getElementById(div)
    }
    rdfTable.rows = Object.entries(rdfTable.json.rows).map(x=>x[0])
    rdfTable.cols = Object.entries(rdfTable.json.rows[Object.entries(rdfTable.json.rows)[0][0]]).map(x=>x[0])
    // remove hidden cols
    rdfTable.cols=rdfTable.cols.filter(x=>x.match(':')) // only linked
    rdfTable.cols=rdfTable.cols.filter(x=>x!="rdfs:member")
    let h = `<hr><p style="font-size:small">${Date()}</p>`
    h += `<p>Compare conventional <a id="csvData" href="${rdfTable.url.replace('.rdf','.csv')}" target="_blank" onmouseover="rdfTable.hoverCSVdata(this)">CSV data</a> from the same source with the linked table assembled below (shaded area) from the corresponding <a href="${rdfTable.url}" target="_blank" onmouseover="rdfTable.hoverRDFdata(this)">RDF data</a>. Note base address of mapped namespaces at the end.</p>`
    h += `<p style="font-size:small"><b>URL</b>: <a href="${rdfTable.url}" target="_blank">${rdfTable.url}</a></p>`
    h += '<div style="overflow-x:auto;overflow-y:auto;max-height:400px">'
    h += '<table style="font-size:small;background-color:azure" id="valueTable">'
    // header
    h += '<tr>'
    rdfTable.cols.forEach(c=>{
        c = c.match(/[^:]+$/)[0]
        let cc = c
        let u = location.origin+location.pathname
        if(cc=='rowID'){cc='*'}
        h += `<th><a href="${u+'?'+rdfTable.url.replace(/[&$]*select=[^&]*/g,'')}&$select=${cc}">${c}</a></th>`
    })
    h += '</tr>'
    // list rows
    rdfTable.rows.forEach(r=>{
        h += '<tr>'
        let rClass = r.match(/[\w]+$/)[0]
        rdfTable.cols.forEach(c=>{
            let cClass = c.match(/[\w]+$/)[0]
            let rc = rdfTable.json.rows[r][c]
            let cc = c.match(/:([^:]+)$/)[1]
            if(cc=="rowID"){
                //h +=`<td><a href="${r+'.json'}" target="_blank" style="color:maroon">[json]</a>: <a href="${r+'.json'}" target="_blank">${rc}</a></td>`
                h +=`<td><a href="${r+'.json?$$exclude_system_fields=false'}" target="_blank">${rc}</a></td>`
            }else{
                h +=`<td class="${rClass} ${cClass}">${rc}</td>`
            }
        })
        h += '</tr>'
    })
    h += '</table></div><hr>'
    // prefixes
    h += '<table style="max-width:25em"><tr><td style="vertical-align:top" id="prefixList">'
    let nm = Object.entries(rdfTable.json.xmlns).map(x=>x[0])
    nm.forEach(n=>{
        h += `<li id="xmlns_${n}" style="font-size:small;color:black"><b>${n}</b>: ${rdfTable.json.xmlns[n]}</li>`
    })
    h += '</td><td style="vertical-align:top"><textarea id="msgArea" style="font-size:small;color:navy;height:22em;width:30em">populate with mouse over value.</textarea></td></tr></table>'
    div.innerHTML=h
}

rdfTable.hoverCSVdata=async function(that){
    if(!that.data){
        that.data = await (await fetch(that.href)).text()
    }
    rdfTable.msg(('CSV data:\r----------\r'+that.data).replace('\n','\r'))
}

rdfTable.hoverRDFdata=async function(that){
    if(!that.data){
        that.data = await (await fetch(that.href)).text()
    }
    rdfTable.msg(('RDF data:\r----------\r'+that.data).replace('\n','\r'))
}

rdfTable.msg=function(msg){
    let ta = document.getElementById('msgArea')
    ta.style.backgroundColor='black'
    ta.style.color='lime'
    ta.style.height='33em'
    ta.style.fontSize='xx-small'
    ta.value=msg
    document.getElementById('msgArea').style.width=`${document.getElementById('valueTable').parentElement.offsetWidth-document.getElementById('prefixList').offsetWidth}px`
}

rdfTable()