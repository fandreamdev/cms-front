import request from '../utils/request'

export interface UploadImageResult {
  url: string
}

export function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request<UploadImageResult>('/uploads/images', {
    method: 'POST',
    body: formData,
  })
}
