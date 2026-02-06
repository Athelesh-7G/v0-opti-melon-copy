import { NextRequest } from "next/server"

interface ImageRequest {
  prompt: string
  model: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageRequest = await request.json()
    const { prompt, model } = body

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Prompt is required" }, { status: 400 })
    }

    if (!model || typeof model !== "string") {
      return Response.json({ error: "Model is required" }, { status: 400 })
    }

    const apiKey = process.env.BYTEZ_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: "BYTEZ_API_KEY not configured. Add your API key in the Vars section." },
        { status: 500 }
      )
    }

    const encodedModel = encodeURIComponent(model)
    const url = `https://api.bytez.com/models/v2/${encodedModel}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ text: prompt }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Bytez API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`Bytez error: ${data.error}`)
    }

    let output = data.output
    if (Array.isArray(output)) {
      output = output[0]
    }

    if (typeof output !== "string") {
      return Response.json({ error: "Unsupported image output format" }, { status: 500 })
    }

    if (output.startsWith("http://") || output.startsWith("https://")) {
      return Response.json({ imageUrl: output })
    }

    const padded = output + "=".repeat((4 - (output.length % 4)) % 4)
    return Response.json({ imageUrl: `data:image/png;base64,${padded}` })
  } catch (error) {
    console.error("Image API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
