import fs from "fs"
import path from "path"

async function fetchAllPatterns() {
  console.log("1. Fetching Pattern Monster library (330 patterns)...")
  const pmRes = await fetch(
    "https://raw.githubusercontent.com/catchspider2002/svelte-svg-patterns/master/src/routes/_index.js"
  )
  const pmText = await pmRes.text()
  const pmMatch = pmText.match(/const index = (\[[\s\S]*?\]);?\s*export default index;/)
  if (!pmMatch) throw new Error("Failed to parse Pattern Monster index")
  const pmList = JSON.parse(pmMatch[1])
  console.log(`   Found ${pmList.length} Pattern Monster patterns.`)

  const formattedPM = pmList.map((p) => {
    const rawPaths = p.path.split("~")
    return {
      id: "pm-" + p.slug,
      title: p.title,
      category: (p.tags && p.tags[0]) || "geometric",
      tags: p.tags || [],
      mode: p.mode, // 'stroke' | 'fill' | 'stroke-join'
      width: p.width,
      height: p.height,
      vHeight: p.vHeight || 0,
      maxStroke: p.maxStroke || 4,
      paths: rawPaths,
      source: "pattern-monster",
    }
  })

  console.log("2. Fetching Hero Patterns library (87 patterns)...")
  const hpRes = await fetch(
    "https://api.github.com/repos/lowmess/hero-patterns/contents/src/patterns"
  )
  const hpFiles = await hpRes.json()
  const hpValid = hpFiles.filter(
    (f) => f.name.endsWith(".js") && !f.name.startsWith("_")
  )
  console.log(`   Found ${hpValid.length} Hero Patterns files. Fetching SVGs...`)

  const formattedHP = []
  for (let i = 0; i < hpValid.length; i += 15) {
    const batch = hpValid.slice(i, i + 15)
    const batchResults = await Promise.all(
      batch.map(async (f) => {
        try {
          const res = await fetch(f.download_url)
          const text = await res.text()
          const dataMatch = text.match(/data:image\/svg\+xml,([^']+)/)
          if (!dataMatch) return null
          const decoded = decodeURIComponent(dataMatch[1])
          const wMatch = decoded.match(/width="?([0-9.]+)"?/)
          const hMatch = decoded.match(/height="?([0-9.]+)"?/)
          const innerMatch = decoded.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
          if (!innerMatch) return null

          const width = parseFloat(wMatch ? wMatch[1] : "80")
          const height = parseFloat(hMatch ? hMatch[1] : "80")
          const id = f.name.replace(".js", "")
          const title = id
            .split("-")
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(" ")

          // Extract path(s)
          const cleanInner = innerMatch[1]
            .replace(/<title>.*?<\/title>/gi, "")
            .replace(/fill="[^"]*"/gi, "")
            .replace(/fill-opacity="[^"]*"/gi, "")
            .trim()

          return {
            id: "hp-" + id,
            title: title,
            category: "architectural",
            tags: ["hero-patterns", "minimal", "architectural"],
            mode: "fill",
            width: width,
            height: height,
            vHeight: 0,
            maxStroke: 2,
            paths: [cleanInner],
            source: "hero-patterns",
          }
        } catch (err) {
          console.error("Failed to parse " + f.name, err)
          return null
        }
      })
    )
    formattedHP.push(...batchResults.filter(Boolean))
  }
  console.log(`   Successfully fetched & parsed ${formattedHP.length} Hero Patterns.`)

  const allPatterns = [...formattedPM, ...formattedHP]
  console.log(`Total Curated SVG Patterns: ${allPatterns.length}`)

  const outPath = path.resolve("C:/MY-TOOLS/ARS-BG-PRO/studio/lib/engine/curated-patterns.json")
  fs.writeFileSync(outPath, JSON.stringify(allPatterns, null, 2), "utf-8")
  console.log(`Written to ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`)
}

fetchAllPatterns().catch(console.error)
