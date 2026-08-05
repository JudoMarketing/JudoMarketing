-- Judo Marketing — Endurecimiento de Storage (auditoría pre Fase 5)
-- Aplicar DESPUÉS de 0005_emails.sql.
-- Limita tamaño y tipo de archivo por bucket para evitar abuso:
-- el formulario de Zelle es público (anon) y sin límites alguien podría
-- llenar el almacenamiento con archivos gigantes.

update storage.buckets
set file_size_limit = 5242880, -- 5 MB
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif']
where id in ('payment-proofs', 'avatars');

update storage.buckets
set file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = array['application/pdf']
where id = 'contracts';
