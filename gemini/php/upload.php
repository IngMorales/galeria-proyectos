<?php
// Configuración básica
$uploadDir = '../uploads/'; // Directorio relativo al script PHP
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
$maxFileSize = 2 * 1024 * 1024; // 2 MB

// Preparar respuesta JSON
header('Content-Type: application/json');
$response = ['success' => false, 'message' => 'Error desconocido.'];

// Verificar si la carpeta uploads existe, si no, intentar crearla
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0775, true)) { // 0775 para permisos, true para recursivo
        $response['message'] = 'Error: No se pudo crear el directorio de subida.';
        echo json_encode($response);
        exit;
    }
}

// Verificar si el directorio tiene permisos de escritura
if (!is_writable($uploadDir)) {
    $response['message'] = 'Error: El directorio de subida no tiene permisos de escritura.';
    // En producción, no muestres detalles del servidor. Loguea el error.
    // error_log("Upload directory {$uploadDir} is not writable.");
    echo json_encode($response);
    exit;
}


// Validar la petición y el archivo
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['projectImage']) && $_FILES['projectImage']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['projectImage'];

        // 1. Validar tamaño
        if ($file['size'] > $maxFileSize) {
            $response['message'] = 'Error: El archivo excede el tamaño máximo permitido (2MB).';
        }
        // 2. Validar tipo (usando mime_content_type para más seguridad que la extensión)
        elseif (!in_array(mime_content_type($file['tmp_name']), $allowedTypes)) {
             $response['message'] = 'Error: Tipo de archivo no permitido. Solo JPG, PNG, GIF.';
        } else {
            // 3. Generar nombre único y seguro
            $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
            // Sanitizar nombre original por si se usa, aunque es mejor generar uno totalmente nuevo
            $safeOriginalName = preg_replace("/[^A-Za-z0-9_\-\.]/", '_', basename($file['name']));
            // Crear nombre único
            $uniqueName = uniqid('proj_', true) . '.' . strtolower($fileExtension);
            $destinationPath = $uploadDir . $uniqueName;

            // 4. Mover archivo subido
            if (move_uploaded_file($file['tmp_name'], $destinationPath)) {
                // Éxito: devolver la URL relativa
                $response['success'] = true;
                $response['message'] = 'Imagen subida correctamente.';
                // La URL debe ser relativa al index.html
                $response['imageUrl'] = 'uploads/' . $uniqueName;
            } else {
                $response['message'] = 'Error: No se pudo guardar el archivo subido.';
                 // Loguear error en el servidor para diagnóstico
                 // error_log("Failed to move uploaded file to {$destinationPath}");
            }
        }
    } elseif (isset($_FILES['projectImage']['error'])) {
        // Manejar otros errores de subida de archivo
        switch ($_FILES['projectImage']['error']) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $response['message'] = 'Error: El archivo excede el tamaño máximo permitido.';
                break;
            case UPLOAD_ERR_PARTIAL:
                $response['message'] = 'Error: El archivo se subió solo parcialmente.';
                break;
            case UPLOAD_ERR_NO_FILE:
                 $response['message'] = 'Error: No se seleccionó ningún archivo.';
                break;
            case UPLOAD_ERR_NO_TMP_DIR:
                $response['message'] = 'Error interno: Falta la carpeta temporal del servidor.';
                break;
            case UPLOAD_ERR_CANT_WRITE:
                $response['message'] = 'Error interno: No se pudo escribir el archivo en el disco.';
                break;
            case UPLOAD_ERR_EXTENSION:
                 $response['message'] = 'Error interno: Una extensión de PHP detuvo la subida del archivo.';
                break;
            default:
                $response['message'] = 'Error desconocido durante la subida del archivo.';
                break;
        }
    } else {
         $response['message'] = 'Error: No se recibió ningún archivo o hubo un problema con la solicitud.';
    }
} else {
    $response['message'] = 'Error: Método de solicitud no válido.';
    http_response_code(405); // Method Not Allowed
}

// Devolver respuesta JSON
echo json_encode($response);
exit;
?>