<?php
header('Content-Type: application/json'); // Important for JS fetch to parse JSON

// --- Configuration ---
$uploadDir = '../uploads/'; // Relative to this script's location
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
$maxFileSize = 2 * 1024 * 1024; // 2 MB

// --- Response Function ---
function sendResponse($success, $message, $imageUrl = null) {
    $response = ['success' => (bool)$success, 'message' => $message];
    if ($success && $imageUrl) {
        $response['imageUrl'] = $imageUrl;
    }
    echo json_encode($response);
    exit; // Stop script execution after sending response
}

// --- Request Validation ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, 'Método no permitido. Solo se acepta POST.');
}

// Check if file was uploaded without errors
if (!isset($_FILES['projectImage']) || !is_uploaded_file($_FILES['projectImage']['tmp_name'])) {
     sendResponse(false, 'No se recibió ningún archivo o hubo un error en la subida.');
}

$file = $_FILES['projectImage'];

// Check for upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    $phpFileUploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'El archivo excede la directiva upload_max_filesize en php.ini.',
        UPLOAD_ERR_FORM_SIZE  => 'El archivo excede la directiva MAX_FILE_SIZE especificada en el formulario HTML.',
        UPLOAD_ERR_PARTIAL    => 'El archivo se subió solo parcialmente.',
        UPLOAD_ERR_NO_FILE    => 'No se subió ningún archivo.',
        UPLOAD_ERR_NO_TMP_DIR => 'Falta una carpeta temporal.',
        UPLOAD_ERR_CANT_WRITE => 'No se pudo escribir el archivo en el disco.',
        UPLOAD_ERR_EXTENSION  => 'Una extensión de PHP detuvo la subida del archivo.',
    ];
    $errorMessage = $phpFileUploadErrors[$file['error']] ?? 'Error desconocido al subir el archivo.';
    sendResponse(false, $errorMessage);
}

// --- File Validation ---
$fileSize = $file['size'];
$fileType = mime_content_type($file['tmp_name']); // More reliable than $file['type']

// Validate file size
if ($fileSize > $maxFileSize) {
    sendResponse(false, 'El archivo es demasiado grande. Máximo permitido: ' . ($maxFileSize / 1024 / 1024) . ' MB.');
}

// Validate file type
if (!in_array($fileType, $allowedTypes)) {
    sendResponse(false, 'Tipo de archivo no permitido. Solo se aceptan JPG, PNG, GIF.');
}

// --- Ensure Upload Directory Exists ---
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
    // Try to create the directory if it doesn't exist
    // 0755 permissions are usually safe, adjust if needed based on server config
    sendResponse(false, 'Error: No se pudo crear el directorio de subidas.');
}
if (!is_writable($uploadDir)) {
    // Check writability AFTER ensuring it exists
     sendResponse(false, 'Error: El directorio de subidas no tiene permisos de escritura.');
}


// --- Generate Unique Filename ---
$originalFileName = basename($file['name']);
$fileExtension = pathinfo($originalFileName, PATHINFO_EXTENSION);
// Create a more unique name to prevent collisions and potential security issues
$safeFileName = preg_replace("/[^A-Za-z0-9_\-\.]/", '_', pathinfo($originalFileName, PATHINFO_FILENAME)); // Sanitize base name
$newFileName = uniqid('proj_') . '_' . $safeFileName . '.' . $fileExtension;
$targetFilePath = $uploadDir . $newFileName;

// --- Move Uploaded File ---
if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
    // Return the RELATIVE path for use in HTML src attribute
    $relativeImageUrl = 'uploads/' . $newFileName;
    sendResponse(true, 'Imagen subida correctamente.', $relativeImageUrl);
} else {
    // More specific error message if possible
    $error = error_get_last();
    $moveErrorMsg = 'No se pudo mover el archivo subido.';
    if ($error) {
       $moveErrorMsg .= ' Detalle: ' . $error['message'];
    }
     sendResponse(false, $moveErrorMsg);
}

?>