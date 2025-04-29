<?php
// php/upload.php
header('Content-Type: application/json');

$uploadDir = '../uploads/';
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
$maxSize = 2 * 1024 * 1024; // 2MB

try {
    if (!isset($_FILES['image'])) throw new Exception('No file uploaded');
    
    $file = $_FILES['image'];
    if ($file['error'] !== UPLOAD_ERR_OK) throw new Exception('Upload error');
    if (!in_array($file['type'], $allowedTypes)) throw new Exception('Invalid file type');
    if ($file['size'] > $maxSize) throw new Exception('File too large');

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $extension;
    $targetPath = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new Exception('Failed to save file');
    }

    echo json_encode(['url' => 'uploads/' . $filename]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?>