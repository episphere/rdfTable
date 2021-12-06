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
    rdfTable.rdftxt=txt
    rdfTable.rdfarr = txt.split(/\n[^\s]/).map(x=>{ // rdf array
        if(x[0]!='<'){
            x='<'+x
        }
        return x
    })
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
        l=l.replace(/<\/rdf:[^>]+>$/,'') // clear tail
        //l=l.replace(/<\/[^>]+>$/,'') // clear tail
        if(l[0]!=' '){ //new row
            //let L=l.match(/<dsbase:([^\s]+) rdf:about="([^\s>"]+)/)
            let L=[]
            L[0]=l
            L[2]=l.match(/rdf:about="([^"]+)"/)[1]
            L[1]=L[2].match(/\/resource\/([^\/]+)/)[1]
            rowID=L[2]
            rdf.rows[rowID]={
                about:{resourceID:L[1]}
            }
            //debugger
        }else{
            rowID
            if(l.match(/>/g).length==2){
                let L = l.match(/\s+<([^>]+)>([^<]+)</)
                //debugger
                rdf.rows[rowID][L[1]]=L[2]
                //rdf.rows[rowID][L[1]]=L[2]
            }else{
                //l=l.replace(/<\/dsbase:[^>]+>$/,'')
                console.log(l)
                l=l.replace(/<\/[^>]+>$/,'')
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
        if(cc=='rowID'){
            cc='*'
            h += `<th><a onmouseover="rdfTable.msgJSON()" href="${u+'?'+rdfTable.url.replace(/[&$]*select=[^&]*/g,'')}&$select=${cc}">${c}</a></th>`
        }else{
            h += `<th><a href="${u+'?'+rdfTable.url.replace(/[&$]*select=[^&]*/g,'')}&$select=${cc}">${c}</a></th>`
        }
        
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
                h +=`<td><a id="${rc}" href="${r+'.json?$$exclude_system_fields=false'}" target="_blank" onmouseover="rdfTable.hoverRow(this)">${rc}</a></td>`
            }else{
                h +=`<td id="${c}" onmouseover="rdfTable.hoverElement(this)" data-element="${encodeURIComponent(JSON.stringify({r:r,c:c,rc:rc}))}" class="${rClass} ${cClass}">${rc}</td>`
            }
        })
        h += '</tr>'
    })
    h += '</table></div><hr>'
    // prefixes
    h += '<table style="max-width:50em"><tr><td style="vertical-align:top" id="prefixList">'
    let nm = Object.entries(rdfTable.json.xmlns).map(x=>x[0])
    nm.forEach(n=>{
        h += `<li id="xmlns_${n}" style="font-size:small;color:black"><b>${n}</b>: ${rdfTable.json.xmlns[n]}</li>`
    })
    h += '</td><td style="vertical-align:top"><textarea id="msgArea" style="font-size:small;color:navy;height:22em;width:28em">populate with mouse over value.</textarea></td></tr></table><hr>'
    div.innerHTML=h
}

rdfTable.hoverCSVdata=async function(that){
    if(!that.data){
        that.data = await (await fetch(that.href)).text()
    }
    rdfTable.msg((`CSV data:\r${that.href}:\r------------------------------------------------------\r`+that.data).replace('\n','\r'))
}

rdfTable.hoverRDFdata = async function(that){
    rdfTable.msg((`RDF data:\r${that.href}:\r------------------------------------------------------\r`+rdfTable.rdftxt).replace('\n','\r'))
    /*
    if(!that.data){
        that.data = await (await fetch(that.href)).text()
    }
    rdfTable.msg((`RDF data:\r${that.href}:\r------------------------------------------------------\r`+that.data).replace('\n','\r'))
    */
}

rdfTable.hoverRow = async function(that){
    if(!that.data){
        that.data = await (await fetch(that.href)).text()
    }
    rdfTable.msg(`<socrata:rowID>${that.textContent}</socrata:rowID>\r------------------------------------------------------\r${JSON.stringify(JSON.parse(that.data),null,3)}`,'small')
}

rdfTable.hoverElement=function(that){
    if(!that.data){
        let dt = JSON.parse(decodeURIComponent(that.dataset.element))
        let res = rdfTable.rdfarr.filter(x=>x.match(dt.r))[0].split(/\n/)
        let h = res[0] // header
        let b = res.slice(1).filter(x=>x.match(dt.c))[0] //body
        that.data=res.slice(0,3).concat([b]).join('\n')
    }   
    rdfTable.msg(that.data,'medium')
}

rdfTable.msg=function(msg,fontsize='x-small'){
    let ta = document.getElementById('msgArea')
    ta.style.backgroundColor='black'
    ta.style.color='lime'
    ta.style.height='32em'
    ta.style.fontSize=fontsize
    ta.value=msg
    document.getElementById('msgArea').style.width=`${document.getElementById('valueTable').parentElement.offsetWidth-document.getElementById('prefixList').offsetWidth}px`
}

rdfTable.msgJSON=()=>{
    let J={}
    Object.assign(J,rdfTable.json) 
    if(J.rows.length==0){
        let R={}
        Object.entries(rdfTable.json.rows).forEach(x=>{
            R[x[0]]=x[1]
        })
        J.rows=R
    }
    rdfTable.msg(`JSON table assembled from RDF:\r----------------------------------------\r${JSON.stringify(J,null,3)}`)
}

rdfTable()