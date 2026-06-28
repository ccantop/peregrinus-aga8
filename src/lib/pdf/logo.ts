import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export async function getLogoSrc(): Promise<string> {
  try {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png'))
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) data[i + 3] = 0
    }
    const png = await sharp(Buffer.from(data), {
      raw: { width: info.width, height: info.height, channels: 4 },
    }).png().toBuffer()
    return `data:image/png;base64,${png.toString('base64')}`
  } catch { return '' }
}
