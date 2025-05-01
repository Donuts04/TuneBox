"use server"

export async function processAudio(formData: FormData) {
  try {
    const response = await fetch("http://localhost:8000/process-audio/", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, notes: data.notes }
  } catch (error) {
    console.error("Error processing audio:", error)
    return { success: false, error: (error as Error).message }
  }
}