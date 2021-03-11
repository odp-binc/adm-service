import { CONTENT_TYPE } from "./CONTENT_TYPE.mjs";
import fs from "fs";

function serveStatic(res, fn, dir) {
  if (!dir) {
    dir = "static"
  }
  fn = dir + fn
  if (fn.indexOf('..') >= 0) {
    return
  }
  if (fn.endsWith('/'))
    fn += "index.html"
  
  const ext = fn.substring(fn.lastIndexOf('.') + 1)
  let type = CONTENT_TYPE[ext]
  if (!type)
    type = 'text/plain'
  try {
    const b = fs.readFileSync(fn)
    res.writeHead(200, { 'Content-Type' : type })
    res.write(b)
  } catch (e) {
    res.writeHead(404)
  }
  res.end()
}

export { serveStatic };
