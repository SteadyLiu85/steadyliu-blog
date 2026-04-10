function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: '上传失败' });
  }

  res.json({ url: `/api/uploads/${req.file.filename}` });
}

module.exports = { uploadImage };
