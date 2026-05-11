const API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY

// Converts text to speech and plays it back — resolves when playback finishes
export async function speakText(text: string, voiceId: string): Promise<void> {
  const id = voiceId || '21m00Tcm4TlvDq8ikWAM'

  if (!API_KEY) {
    throw new Error('Missing VITE_ELEVENLABS_API_KEY')
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${id}/stream`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!response.ok) {
    throw new Error('TTS failed')
  }

  const audioBlob = await response.blob()
  const audioUrl = URL.createObjectURL(audioBlob)
  const audio = new Audio(audioUrl)

  try {
    await audio.play()
  } catch {
    URL.revokeObjectURL(audioUrl)
    throw new Error('Audio playback was blocked or failed to start')
  }

  await new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl)
      resolve()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl)
      reject(new Error('Audio playback failed'))
    }
  })
}

async function transcribeAudioBlob(audioBlob: Blob): Promise<string> {
  if (!API_KEY) {
    throw new Error('Missing VITE_ELEVENLABS_API_KEY')
  }

  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.webm')
  formData.append('model', 'scribe_v1')

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY },
    body: formData,
  })

  if (!response.ok) throw new Error('STT failed')
  const data = await response.json()
  return data.text || ''
}

/** Fixed 3s clip — used by recipe voice entry */
export async function recordAndTranscribe(): Promise<string> {
  return new Promise((resolve, reject) => {
    void (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        const chunks: BlobPart[] = []

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data)
        }

        mediaRecorder.onstop = async () => {
          try {
            stream.getTracks().forEach((t) => t.stop())
            const audioBlob = new Blob(chunks, { type: 'audio/webm' })
            const text = await transcribeAudioBlob(audioBlob)
            resolve(text)
          } catch (err) {
            reject(err)
          }
        }

        mediaRecorder.onerror = (e) => reject(e)
        mediaRecorder.start()
        setTimeout(() => mediaRecorder.stop(), 3000)
      } catch (err) {
        reject(err)
      }
    })()
  })
}

export type HoldRecorder = { stop: () => Promise<string> }

/** Press-and-hold: start recording; call stop() to finish and get transcript */
export async function beginHoldRecording(): Promise<HoldRecorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mediaRecorder = new MediaRecorder(stream)
  const chunks: BlobPart[] = []

  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  return await new Promise<HoldRecorder>((resolve, reject) => {
    mediaRecorder.onerror = () => {
      stream.getTracks().forEach((t) => t.stop())
      reject(new Error('Recorder error'))
    }

    try {
      mediaRecorder.start(250)
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop())
      reject(e)
      return
    }

    resolve({
      stop: () =>
        new Promise<string>((res, rej) => {
          if (mediaRecorder.state !== 'recording') {
            stream.getTracks().forEach((t) => t.stop())
            res('')
            return
          }

          mediaRecorder.onstop = async () => {
            try {
              stream.getTracks().forEach((t) => t.stop())
              const audioBlob = new Blob(chunks, { type: 'audio/webm' })
              if (chunks.length === 0 || audioBlob.size < 32) {
                res('')
                return
              }
              const text = await transcribeAudioBlob(audioBlob)
              res(text)
            } catch (e) {
              rej(e)
            }
          }

          try {
            mediaRecorder.requestData?.()
          } catch {
            /* optional API */
          }
          mediaRecorder.stop()
        }),
    })
  })
}
