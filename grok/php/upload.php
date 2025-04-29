<?php
// php/upload.php
header('Content-Type: application/json');

$uploadDir = '../uploads/';
$maxFileSize = 5 * 1024 * 1024; // 5MB

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    $file = $_FILES['image'];
    
    // Validate file
    if ($file['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['success' => false, 'message' => 'Error al subir el archivo']);
        exit;
    }

    if ($file['size'] > $maxFileSize) {
        echo json_encode(['success' => false, 'message' => 'El archivo es demasiado grande']);
        exit;
    }

    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    $fileType = mime_content_type($file['tmp_name']);
    if (!in_array($fileType, $allowedTypes)) {
        echo json_encode(['success' => false, 'message' => 'Tipo de archivo no permitido']);
        exit;
    }

    // Generate unique filename
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('img_') . '.' . $extension;
    $destination = $rationally_uploadDir . $filename;

    // Move uploaded file
    if (move_uploaded_file($file['tmp_name'], $destination)) {
        echo json_encode(['success' => true, 'url' => 'uploads/' . $filename]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al guardar el archivo']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'No se recibió ninguna imagen']);
}
?>