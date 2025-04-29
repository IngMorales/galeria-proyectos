<?php
$uploadDir = '../uploads/';
$response = ['success' => false, 'url' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['image'])) {
    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    $maxSize = 2 * 1024 * 1024; // 2MB

    if ($file['error'] === UPLOAD_ERR_OK) {
        if (!in_array($file['type'], $allowedTypes)) {
            $response['message'] = 'Tipo de archivo no permitido.';
        } elseif ($file['size'] > $maxSize) {
            $response['message'] = 'Archivo demasiado grande.';
        } else {
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $newName = uniqid('img_') . '.' . $ext;
            $targetPath = $uploadDir . $newName;

            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                $response['success'] = true;
                $response['url'] = '/' . ltrim($targetPath, './');
            } else {
                $response['message'] = 'Error al mover el archivo.';
            }
        }
    } else {
        $response['message'] = 'Error en la subida: ' . $file['error'];
    }
} else {
    $response['message'] = 'No se recibió imagen.';
}

echo json_encode($response);