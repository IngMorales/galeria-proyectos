<?php
header('Content-Type: application/json');

$targetDir = "../uploads/";
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

if (isset($_FILES['image'])) {
    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    $maxSize = 2 * 1024 * 1024; // 2MB

    if (!in_array($file['type'], $allowedTypes)) {
        echo json_encode(['error' => 'Tipo de archivo no permitido']);
        exit;
    }

    if ($file['size'] > $maxSize) {
        echo json_encode(['error' => 'Archivo demasiado grande']);
        exit;
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . "." . $extension;
    $filepath = $targetDir . $filename;

    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        echo json_encode(['url' => "uploads/" . $filename]);
    } else {
        echo json_encode(['error' => 'Error al subir el archivo']);
    }
} else {
    echo json_encode(['error' => 'No se recibió archivo']);
}
