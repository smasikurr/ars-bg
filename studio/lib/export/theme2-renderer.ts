import { THEME2_FRAGMENT_SHADER, THEME2_VERTEX_SHADER } from "@/lib/engine/theme2-shader"
import type { Theme2Config } from "@/store/studio"

/**
 * Headless Offscreen WebGL Renderer for Theme 2 (Matrix / Fluid / SDF)
 * Reuses a single WebGL context across bulk export batches to prevent GPU context loss.
 */
export class Theme2HeadlessRenderer {
  public canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private buf: WebGLBuffer
  private tex: WebGLTexture

  constructor(width: number, height: number) {
    this.canvas = document.createElement("canvas")
    this.canvas.width = width
    this.canvas.height = height

    const gl =
      this.canvas.getContext("webgl", {
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
        alpha: false,
        antialias: true,
      }) ||
      (this.canvas.getContext("experimental-webgl", {
        preserveDrawingBuffer: true,
      }) as WebGLRenderingContext | null)

    if (!gl) {
      throw new Error("WebGL context creation failed for Theme 2 offscreen rendering.")
    }
    this.gl = gl

    const vs = this.createShader(gl.VERTEX_SHADER, THEME2_VERTEX_SHADER)
    const fs = this.createShader(gl.FRAGMENT_SHADER, THEME2_FRAGMENT_SHADER)
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const err = gl.getProgramInfoLog(prog)
      throw new Error(`Theme 2 Shader Program Link Error: ${err}`)
    }
    this.program = prog
    gl.useProgram(prog)

    // Fullscreen quad buffer
    this.buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )
    const pos = gl.getAttribLocation(prog, "position")
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(pos)

    // Background dummy 1x1 black texture
    this.tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255])
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  }

  private createShader(type: number, src: string): WebGLShader {
    const s = this.gl.createShader(type)!
    this.gl.shaderSource(s, src)
    this.gl.compileShader(s)
    if (!this.gl.getShaderParameter(s, this.gl.COMPILE_STATUS)) {
      const err = this.gl.getShaderInfoLog(s)
      throw new Error(`Shader compilation error: ${err}`)
    }
    return s
  }

  /**
   * Renders the specified Theme2 configuration to the canvas at full resolution
   */
  public render(config: Theme2Config, time = 0): HTMLCanvasElement {
    const gl = this.gl
    const prog = this.program
    const loc = (n: string) => gl.getUniformLocation(prog, n)

    gl.useProgram(prog)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)

    gl.uniform2f(loc("u_resolution"), this.canvas.width, this.canvas.height)
    gl.uniform1f(loc("u_ref_height"), this.canvas.height)
    gl.uniform1f(loc("u_time"), time)
    gl.uniform1i(loc("u_colorCount"), config.colors.length)

    // Convert colors to Float32Array RGB (0..1)
    const cd = new Float32Array(8 * 3)
    config.colors.slice(0, 8).forEach((hex, i) => {
      const clean = (hex || "#000000").replace("#", "")
      cd[i * 3] = (parseInt(clean.slice(0, 2), 16) || 0) / 255
      cd[i * 3 + 1] = (parseInt(clean.slice(2, 4), 16) || 0) / 255
      cd[i * 3 + 2] = (parseInt(clean.slice(4, 6), 16) || 0) / 255
    })
    gl.uniform3fv(loc("u_colors"), cd)

    gl.uniform1f(loc("u_flow_type"), config.flowType)
    gl.uniform1f(loc("u_zoom"), config.zoom * 0.028 + 0.2)
    gl.uniform2f(loc("u_pan"), config.panX, config.panY)
    gl.uniform1f(loc("u_flow_speed"), config.speed * 0.02)
    gl.uniform1f(loc("u_liquid_str"), config.liquid * 0.02)
    gl.uniform1f(loc("u_morph"), (config.morph / 100.0) * 3.0)
    gl.uniform1f(loc("u_rotation"), config.rotation * (Math.PI / 180.0))

    gl.uniform1i(loc("u_enable_art"), config.artEnable ? 1 : 0)
    gl.uniform1f(loc("u_art_type"), config.artType)
    gl.uniform1f(loc("u_art_size"), config.artSize)
    gl.uniform1f(loc("u_art_shape"), config.artShape)
    gl.uniform1f(loc("u_art_contrast"), config.artContrast)

    const parseHex = (hex: string) => {
      const clean = (hex || "#000000").replace("#", "")
      return [
        (parseInt(clean.slice(0, 2), 16) || 0) / 255,
        (parseInt(clean.slice(2, 4), 16) || 0) / 255,
        (parseInt(clean.slice(4, 6), 16) || 0) / 255,
      ]
    }
    const dotCol = parseHex(config.artDotColor || "#295EFF")
    const bgCol = parseHex(config.artBgColor || "#050508")
    gl.uniform3f(loc("u_art_dot_color"), dotCol[0], dotCol[1], dotCol[2])
    gl.uniform3f(loc("u_art_bg_color"), bgCol[0], bgCol[1], bgCol[2])
    gl.uniform1i(loc("u_art_bg_mode"), config.artBgMode ?? 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.tex)
    gl.uniform1i(loc("u_bg_texture"), 0)
    gl.uniform1i(loc("u_has_bg_texture"), config.hasBgTexture ? 1 : 0)
    gl.uniform1i(loc("u_color_mode"), config.colorMode)
    gl.uniform1f(loc("u_blend_bias"), config.blendBias / 100.0)
    gl.uniform1f(loc("u_blend_sharp"), config.blendSharp / 100.0)

    gl.drawArrays(gl.TRIANGLES, 0, 6)
    return this.canvas
  }

  public destroy() {
    try {
      this.gl.deleteProgram(this.program)
      this.gl.deleteBuffer(this.buf)
      this.gl.deleteTexture(this.tex)
      const ext = this.gl.getExtension("WEBGL_lose_context")
      if (ext) ext.loseContext()
    } catch {}
  }
}
