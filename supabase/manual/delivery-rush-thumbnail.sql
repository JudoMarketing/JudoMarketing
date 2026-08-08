-- La captura del home de Delivery Rush no luce bien: usamos su imagen de marca.
update sites
   set portfolio_image = '/portfolio/delivery-rush.jpg'
 where domain = 'deliveryrushflorida.com';
