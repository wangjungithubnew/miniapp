const cloud = require('wx-server-sdk')
const { PDFDocument } = require('pdf-lib')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async event => {
  const { pdfFileID, signatureFileID, x, y, width, height } = event
  if (!pdfFileID || !signatureFileID) throw new Error('缺少 PDF 或签名文件')

  const [pdfFile, signatureFile] = await Promise.all([
    cloud.downloadFile({ fileID: pdfFileID }),
    cloud.downloadFile({ fileID: signatureFileID })
  ])
  const pdf = await PDFDocument.load(pdfFile.fileContent)
  if (pdf.getPageCount() !== 1) throw new Error('目前只支持单页 PDF')
  const page = pdf.getPages()[0]
  const image = await pdf.embedPng(signatureFile.fileContent)
  const w = Number(width) || 120
  const h = Number(height) || 48
  const pageWidth = page.getWidth()
  const pageHeight = page.getHeight()
  const pdfX = Math.max(0, Math.min(pageWidth - w, Number(x) || 0))
  const pdfY = Math.max(0, Math.min(pageHeight - h, pageHeight - (Number(y) || 0) - h))
  page.drawImage(image, { x: pdfX, y: pdfY, width: w, height: h })
  const output = await pdf.save()
  const uploaded = await cloud.uploadFile({
    cloudPath: `signed/${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`,
    fileContent: Buffer.from(output)
  })
  return { fileID: uploaded.fileID }
}
