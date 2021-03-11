import http from 'http'
import fs from 'fs'
import { serveStatic } from "./lib/serveStatic.mjs"
import { dotEnvJSON } from "./lib/dotEnvJSON.mjs";

const env = dotEnvJSON();
const PORT = env.PORT || 8002;
const ROOT = env.ROOT || "/adm-service/";
const STATIC_DIR = env.STATIC_DIR || "static";
const PATH_DATA = env.PATH_DATA || 'data/data.json'
const CREDIT = env.CREDIT || "新宿区役所";
const TITLE = env.TITLE || '行政サービス簡単案内';
const TITLE_BODY = env.TITLE_BODY || '行政サービス簡単案内';
const DESCRIPTION = env.DESCRIPTION || "行政サービス（一部外部サービス）やその問い合わせ先・ホームページを検索やカテゴリーから簡単に探せます。";

let alldata = []
function save(data) {
  fs.writeFileSync(PATH_DATA, JSON.stringify(data))
}
function load() {
  alldata = JSON.parse(fs.readFileSync(PATH_DATA)).results.bindings
}
/*
async function download() {
  //const endpoint = "https://sparql.odp.jig.jp/";
  const endpoint = "http://52.198.68.11/api/v1/sparql";
  const graph = "http://odp.jig.jp/rdf/jp/test/group/966";
  const query = `select * { GRAPH <${graph}> { ?s ?p ?o . } }`;
  const url = endpoint + "?output=json&query=" + encodeURIComponent(query);
  const data = await (await fetch(url)).json();
  console.log("fetch", data);
}
download();
*/
load()

import { getDateByMilliseconds } from "./lib/getDate.mjs";
try {
  fs.mkdirSync("log");
} catch (e) {
//  console.log(e);
}
const logDaily = (s) => {
  const day = getDateByMilliseconds();
  const year = day.substring(0, 4);
  try {
    fs.mkdirSync("log/" + year);
  } catch (e) {
  //  console.log(e);
  }
  const ymd = day.substring(0, 4 + 2 + 2);
  try {
    fs.appendFileSync("log/" + year + "/" + ymd + ".log", day + "\t" + s + "\n");
  } catch (e) {
  //  console.log(e);
  }
};

const encodeURIComponent2 = function(s) {
  s = s.replace(/\//g, "__")
  return encodeURIComponent(s)
}
const decodeURIComponent2 = function(s) {
  s = decodeURIComponent(s)
  s = s.replace(/__/g, "/")
  return s
}

function serveAPI(fn, query) {
  if (fn.endsWith('/add')) {
    data.push(query)
    save()
  } else if (fn.endsWith('/list')) {
    return data
  } else if (fn.endsWith('/get')) {
    return data[query.idx]
  } else if (fn.endsWith('/clear')) {
    data = []
    save()
  } else if (fn.endsWith('/remove')) {
    data.splice(query.idx, 1)
    save()
  }
}

// mini SPARQL
const query = function(s, p, o) {
  const res = []
  for (const item of alldata) {
    if ((!s || item.s.value == s) && (!p || item.p.value == p) && (!o || item.o.value == o)) {
      res.push(item)
    }
  }
  return res
}
const getTypes = function() {
  const types = query(null, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", null)
  const res = []
  for (const item of types) {
    const type = item.o.value
    if (res.indexOf(type) == -1)
      res.push(type)
  }
  return res
}
const queryType = function(type) {
  const types = query(null, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", null)
  const res = []
  for (const item of types) {
    if (item.o.value == type) {
      res.push(item.s.value)
    }
  }
  return res
}
// --
const menus = queryType("http://odp.jig.jp/odp/1.0#AdministrativeService")

const TYPES = {
  "http://www.w3.org/2000/01/rdf-schema#label": "name", // "名称",
  "http://schema.org/url": "url", // "URL",
  "http://schema.org/contactPoint http://www.w3.org/2000/01/rdf-schema#label": "contact", // "担当",
  "http://schema.org/contactPoint http://schema.org/telephone": "tel", // "電話",
  "http://schema.org/contactPoint http://schema.org/faxNumber": "fax", // "FAX",
  "http://odp.jig.jp/odp/1.0#note": "note", // "備考"
  "http://odp.jig.jp/odp/1.0#order": "order", // ソート順
  /*
  "http://odp.jig.jp/odp/1.0#classified http://odp.jig.jp/odp/1.0#layer": "分類1", 
  "http://odp.jig.jp/odp/1.0#classified http://www.w3.org/2000/01/rdf-schema#label": "分類2", 
  "http://odp.jig.jp/odp/1.0#classified http://odp.jig.jp/odp/1.0#layer 3": "分類3", 
  */
}
const TYPE_TRANS = {
  ja: { name: "名称", url: "URL", contact: "担当", tel: "電話", fax: "FAX", note: "備考" }
}
const TYPE_SERIES = [ 'contact', 'tel', 'fax', 'url', 'note' ]

const getMenu = function(menuid) {
  const menu = query(menuid, null, null)
  const item = {}
  for (const amenu of menu) {
    if (amenu.o.type == "bnode") {
      const bnode = query(amenu.o.value, null, null)
      let layer = null
      let label = null
      for (const b of bnode) {
        const name = TYPES[amenu.p.value + " " + b.p.value]
        //console.log(amenu.p.value + " " + b.p.value)
        if (name) {
          item[name] = b.o.value
        } else if (amenu.p.value == "http://odp.jig.jp/odp/1.0#classified") {
          if (b.p.value == "http://odp.jig.jp/odp/1.0#layer") {
            layer = b.o.value
          } else if (b.p.value == "http://www.w3.org/2000/01/rdf-schema#label") {
            label = b.o.value
          }
        }
      }
      if (layer && label) {
        item["layer" + layer] = label
      }
  } else {
      const name = TYPES[amenu.p.value]
      if (name)
        item[name] = amenu.o.value
    }
  }
  return item
}
/*
//const menuid = menus[0]
const menuid = "http://odp.jig.jp/rdf/jp/test/group/913#%E5%9C%9F%E5%9C%B0%E5%8F%96%E5%BC%95%E3%81%AE%E5%B1%8A%E5%87%BA/%E9%98%B2%E7%81%BD%E9%83%BD%E5%B8%82%E3%81%A5%E3%81%8F%E3%82%8A%E8%AA%B2/035273-3593/033209-9227////"
//http://odp.jig.jp/rdf/jp/test/group/913#%E5%BF%83%E8%BA%AB%E9%9A%9C%E5%AE%B3%E8%80%85%E7%A6%8F%E7%A5%89%E6%89%8B%E5%BD%93/%E9%9A%9C%E5%AE%B3%E8%80%85%E7%A6%8F%E7%A5%89%E8%AA%B2%E7%9B%B8%E8%AB%87%E4%BF%82/035273-4518/033209-3441/%E7%A6%8F%E7%A5%89/%E9%9A%9C%E5%AE%B3%E8%80%85%E7%A6%8F%E7%A5%89/%E6%89%8B%E5%BD%93%E3%83%BB%E5%8A%A9%E6%88%90%E3%83%BB%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9/%E6%89%8B%E5%BD%93"
console.log(getMenu(menuid))
return
*/
const list = []
let i = 0
for (const menu of menus) {
  const item = getMenu(menu)
  list.push(item)
}

const getItems = function(layer1, layer2, layer3, layer4) {
  const res = []
  const items = []
  const add = function(layer, order) {
    if (layer) {
      let flg = false
      for (let j = 0; j < res.length; j++) {
        if (res[j][0] == layer) {
          flg = true
          if (res[j][1] > order) {
            res[j][1] = order
          }
          break
        }
      }
      if (!flg) {
        res.push([ layer, order ])
      }
    }
  }
  if (!layer1) {
    for (const i of list) {
      add(i.layer1, i.order)
      if (!i.layer1) {
        items.push(i)
      }
    }
  } else if (!layer2) {
    for (const i of list) {
      if (i.layer1 == layer1) {
        add(i.layer2, i.order)
        if (!i.layer2) {
          items.push(i)
        }
      }
    }
  } else if (!layer3) {
    for (const i of list) {
      if (i.layer1 == layer1 && i.layer2 == layer2) {
        add(i.layer3, i.order)
        if (!i.layer3) {
          items.push(i)
        }
      }
    }
  } else if (!layer4) {
    for (const i of list) {
      if (i.layer1 == layer1 && i.layer2 == layer2 && i.layer3 == layer3) {
        add(i.layer4, i.order)
        if (!i.layer4) {
          items.push(i)
        }
      }
    }
  } else {
    for (const i of list) {
      if (i.layer1 == layer1 && i.layer2 == layer2 && i.layer3 == layer3 && i.layer4 == layer4) {
        items.push(i)
      }
    }
  }
  for (let i = 0; i < res.length; i++) {
    res[i] = { name: res[i][0], layer: encodeURIComponent2(res[i][0]) + "/", order: res[i][1] }
  }
  return { layer: res, items: items }
}
const getItemByName = function(id) {
  const cand = list.filter(i => i.name == id)
  // contact 重複排除
  const contacts = []
  const res = []
  for (let i = 0; i < cand.length; i++) {
    if (!cand[i]["contact"] || contacts.indexOf(cand[i].contact) == -1) {
      res.push(cand[i])
      contacts.push(cand[i].contact)
    }
  }
  //console.log(res)
  return res
  /*
  for (let i of list) {
//    if (i.id == id)
    if (i.name == id)
      return i
  }
  return null
  */
}
const searchItemByName = function(id) {
  const key = id.split(' ')
  return list.filter(i => {
    const n = i.name
    if (!n)
      return false
//    console.log(i, n)
    for (let k of key) {
      if (n.indexOf(k) == -1)
        return false
    }
    return true
  })
  /*
  for (let i of list) {
//    if (i.id == id)
    if (i.name == id)
      return i
  }
  return null
  */
}

// -- html

const makeUL = function(json, fullpathflg) {
//  console.log(json)
  const chk = {} // 名称重複排除
  const list = []
  for (let i = 0; i < json.length; i++) {
    const item = json[i]
    if (!item.name)
      continue
    if (chk[item.name])
      continue
    chk[item.name] = item.name

    let base = ''
    if (fullpathflg) {
      for (let i = 1; i <= 4; i++) {
        const l = item['layer' + i]
        if (!l)
          break
        base += encodeURIComponent2(l) + "/"
      }
    }
    if (item.layer) {
      list.push([ item.name, "<li><a href='" + base + item.layer + "'>" + item.name + "</a></li>", item.order ])
    } else {
      //s.push("<li><a href='" + item.id + "_id'>" + item.name + "</a></li>")
      list.push([ item.name, "<li><a href='" + base + encodeURIComponent2(item.name) + "_id'>" + item.name + "</a></li>", item.order ])
    }
  }

  // 文字コード順ソート
  list.sort(function(a, b) {
    
    const ao = a[2]
    const bo = b[2]
    if (ao != "") {
      if (bo != "") {
        const abn = parseInt(ao) - parseInt(bo)
        if (abn)
          return abn
      } else {
        return 1
      }
    } else if (bo == "") {
      return -1
    }

    const a2 = a[0]
    const b2 = b[0]
    for (let i = 0; i < Math.min(a2.length, b2.length); i++) {
      const n = a2.charCodeAt(i) - b2.charCodeAt(i)
      if (n != 0)
        return n
    }
    return a2.length < b2.length ? 1 : -1
  })

  const s = []
  s.push("<ul>")
  for (let i = 0; i < list.length; i++)
    s.push(list[i][1])
  s.push("</ul>")
  return s.join("")
}
const getSortedArray = function(json, series) {
  const res = []
  for (const name in json) {
    res.push([name, json[name]])
  }
  res.sort(function(a, b) {
    return series.indexOf(a[0]) - series.indexOf(b[0])
  })
  return res
}
const makeTable = function(json, first) {
  const s = []
  s.push("<table>")
  const data = getSortedArray(json, TYPE_SERIES)
//  for (const name in json) {
  for (const d of data) {
    const name = d[0]
    let val = d[1]
    /*
    if (name == "id")
      continue
    */
    if (name == 'name')
      continue
    //if (name == 'name' && !first) // 名称は先頭だけ
    //  continue
    const tname = TYPE_TRANS.ja[name]
    if (tname) {
      s.push("<tr>")
      s.push("<th>" + tname + "<th>")
//      let val = json[name]
      /*
      if (val.startsWith("http://") || val.startsWith("https://")) {
        val = "<a href=" + val + ">" + val + "</a>"
      } else if (val.startsWith("03") && name.indexOf("fax") == -1) {
        val = "<a href=tel:" + val + ">" + val + "</a>"
      }
      */
      if (val.startsWith("03") && name.indexOf("fax") == -1) {
        val = "<a href=tel:" + val + ">" + val + "</a>"
      }
      val = makeTextWithLink(val)
      s.push("<td>" + val + "<td>")
      s.push("</tr>")
    }
  }
  s.push("</table>")
  return s.join("")
}

const makeTextWithLink = function(s) {
  const reg = new RegExp("((https?)(:\/\/[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+))", "g")
  //return s.replace(reg, "<a href='$1' target='_blank'>$1</a>")
  return s.replace(reg, "<a href='$1'>$1</a>")
}

// test
//const json = getItems("相談", "生活一般の相談", "交通事故", null)
//const json = getItems("くらし", "生活環境", "消費生活", null)
//const json = getItems("相談", "生活一般の相談", null)
//console.log(json)
//res.write(JSON.stringify(json))

// --
const server = http.createServer()
server.on('request', function(req, res) {
  if (ROOT.length > 1 && req.url.startsWith(ROOT)) {
    req.url = req.url.substring(ROOT.length - 1)
  }
  //console.log(req.url)
  if (req.url == "/favicon.ico") {
    res.end()
    return
  }
  if (req.url.startsWith("/img/") || req.url.endsWith(".css")) {
    serveStatic(res, req.url, STATIC_DIR)
    return
  }
  //console.log(req.url)
  logDaily(req.url);

  //const baseurl = "/"
  const baseurl = ROOT

  const type = "text/html; charset=utf-8"
  res.writeHead(200, { 'Content-Type' : type })
  res.write("<!DOCTYPE html><html><head><meta charset='utf-8'/><meta name='viewport' content='width=device-width'/>")
  res.write('<meta name="format-detection" content="telephone=no">')
  res.write("<link rel='stylesheet' type='text/css' href='" + baseurl + "style.css'/>")
  res.write("<title>" + TITLE + "</title>")
  res.write("</head><body>")
  res.write("<div class=title><h1><a href='" + baseurl + "'>" + TITLE_BODY + "</a></h1>")
  res.write("<div class=lead>" + DESCRIPTION + "</div>")
  res.write("</div>")
  //console.log(getTypes())

  if (req.url.startsWith("/?search=")) {
    const search = decodeURIComponent2(req.url.substring(9)).replace(/\+/g, ' ').replace(/　/g, ' ')
    //console.log(search)

    res.write("<div class=search>")
    res.write("<form action='" + baseurl + "/'><input type=text name=search placeholder='キーワード' value='" + search + "'><input type=submit value=検索></form>")
    res.write("</div>")
    
    res.write("<div class=category>")
    res.write("<h2>検索結果: " + search + "</h2>")
    const items = searchItemByName(search)
    //console.log(items)
    res.write(makeUL(items, true))
    res.write("</div>")
} else {
    const layers = req.url.substring(1).split('/')
    for (let i = 0; i < layers.length; i++) {
      layers[i] = decodeURIComponent2(layers[i])
    }

    {
      const s = []
      for (let i = 0; i < layers.length; i++) {
        const l = layers[i]
        if (l.endsWith("_id"))
          break
      }
    }

    //
    const json = getItems(layers[0], layers[1], layers[2], layers[3])
    //res.write(JSON.stringify(json))
    let pathurl = baseurl
    let paths = []
    let lastcat = null
    for (let i = 0; i < 4; i++) {
      const l = layers[i]
      if (!l)
        break
      if (!l.endsWith("_id"))
        lastcat = l
      const nm = l.endsWith("_id") ? l.substring(0, l.length - 3) : l
      pathurl += l.endsWith("_id") ? encodeURIComponent2(l) : encodeURIComponent2(l) + "/"
      if (l.endsWith("_id")) {
        paths.push(nm)
      } else {
        paths.push("<a href='" + pathurl + "'>" + nm + "</a>")
      }
    }
    if (paths.length > 0) {
      res.write("<div class=sitemap>")
      res.write("<a href='" + baseurl + "'>TOP</a> &gt; ")
      res.write(paths.join(" &gt; "))
      res.write("</div>")
    }

    // top
    if (!lastcat) {
      res.write("<div class=search>")
      res.write("<form action='" + baseurl + "'><input type=text name=search placeholder='キーワード'><input type=submit value=検索></form>")
      res.write("</div>")
    }

    //const json = list
    if (req.url.endsWith("_id")) {
      let id = layers[layers.length - 1]
      id = id.substring(0, id.length - 3)

      res.write("<div class=category>")
      res.write("<h2>" + id + "</h2>")
      res.write("</div>")

      const item = getItemByName(decodeURIComponent2(id))
      for (let i = 0; i < item.length; i++) {
        res.write("<div class=item>")
        res.write(makeTable(item[i], i == 0))
        res.write("</div>")
      }
    } else {
      const cat = json.layer
      if (cat.length > 0) {
        res.write("<div class=" + (lastcat ? "category" : "topcategory") + ">")
        res.write("<h2>" + (lastcat ? lastcat : "カテゴリー") + "</h2>")
        res.write(makeUL(cat))
        res.write("</div>")
      }

      const list = json.items
      if (list.length > 0 && lastcat) {
        res.write("<div class=list>")
        if (cat.length == 0) {
          res.write("<h2>" + lastcat + "</h2>")
        }
        res.write(makeUL(list))
        res.write("</div>")
      }
    }
  }
  res.write("<div class=footer><h3>CC BY " + CREDIT + " 行政メニューオープンデータ</h3></div>")
  res.write("</body></html>")
  
  res.end()

  /*

  if (req.url.startsWith('/api/')) {
    const urlp = url.parse(req.url, true)
    res.writeHead(200, { 'Content-Type' : 'application/json; charset=utf-8' })
    let resjson = serveAPI(urlp.pathname, urlp.query)
    if (!resjson)
      resjson = { 'res' : 'OK' }
    res.write(JSON.stringify(resjson))
  } else {
    serveStatic(res, req.url)
  }
  */
})
server.listen(PORT)
console.log("ready (static: " + STATIC_DIR + ")")
console.log("http://localhost:" + PORT + ROOT)

/*
8002あける
iptables -I INPUT 5 -p tcp -m tcp --dport 8002 -j ACCEPT
*/


