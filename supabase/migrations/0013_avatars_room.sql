-- ============================================================
-- 0013: Aire para las selfies de los vendedores
-- Las fotos ahora se comprimen en el teléfono antes de subir (quedan en
-- pocos KB), pero si un navegador viejo no puede comprimir, la original
-- debe caber igual. Se sube el límite del bucket de avatares y se aceptan
-- los formatos que mandan los teléfonos.
-- El bucket de comprobantes de pago (público, anónimo) queda igual de
-- estricto que antes: ahí el límite bajo es la protección.
-- ============================================================

update storage.buckets
set file_size_limit = 15728640, -- 15 MB
    allowed_mime_types = array[
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
      'image/heic', 'image/heif', 'image/gif', 'image/avif'
    ]
where id = 'avatars';

-- Permitir reemplazar la propia foto en el almacenamiento (el candado de
-- quién puede cambiarla vive en profiles, migración 0012)
drop policy if exists "vendedor actualiza su propia foto" on storage.objects;
create policy "vendedor actualiza su propia foto"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
