# Turn off your phone (carrusel en inglés de Judo Marketing)

La versión en inglés de «Apaga el teléfono», pedida por Junior el 30 de
octubre de 2026. Las mismas 10 láminas, con los mismos colores y escenas.
Aquí la lámina de anuncios dice **$5 al día**, como pidió Junior; la de
español dice $2.

## Qué cambia respecto del español (además del idioma)

- **La portada** es «Is your business still selling with your phone off?».
  «Does your business keep selling if you turn off your phone?» no cabía sin
  cortar palabras.
- **Pregunta 4:** «When you don’t answer, do sales stop?». Es más corta que
  la traducción literal y cabe con su bucle.
- **Pregunta 6:** «How many people visited your website this week?».
- **La distancia** del anuncio de ejemplo va en millas (Miami · 10 mi), como
  se usa en Estados Unidos.
- **El pie** dice «Swipe →» y la última lámina «Save it».

## Pie de foto

```
Is your business still selling when you’re not around? Take the test 👇

6 questions: bots in your contact form, changes that depend on someone else, October’s PHP flaw, unanswered messages, ads and website visits.
Count your yeses. Slide 9 shows what to do about each one.

Message us on WhatsApp: +1 305 934 9981. We’ll tell you honestly if we can help.

How many yeses did you get? Tell us in the comments.

#MiamiBusiness #MiamiSmallBusiness #SmallBusinessTips #MiamiEntrepreneur
```

## Texto alternativo

1. Cover: “Is your business still selling with your phone off?” over a phone’s “slide to power off” button.
2. “6 questions. Answer yes or no.” Six numbered chips. “Count your yeses. At the end, what to do about each one.”
3. Question 1: “Is your contact form flooded with bot messages?” An inbox with 38 new messages: bot spam and, at the bottom, a message from a real customer.
4. Question 2: “To change a price on your website, do you wait on someone?” A chat: on Monday you ask to change the combo price, they say “this week,” and on Thursday you are still asking. At the bottom: “The next one made the news in October.”
5. Question 3: “PHP2Shell made the news. Does your site have the patch?” That PHP flaw can open your server without a password, and 7 in 10 websites run PHP. A red alert: critical severity, 9.2 out of 10, from October 21, 2026.
6. Question 4: “When you don’t answer, do sales stop?” Answering, quoting, charging and booking don’t have to depend on you. A lock screen at 11:47 with two unanswered customer messages. At the bottom: “And the next one costs less than you think.”
7. Question 5: “Want to advertise on social media but don’t know where to start?” It costs less than you think: with 5 dollars a day you can test an ad. A budget control set to 5 dollars a day, for Miami within 10 miles, with a “Publish ad” button.
8. Question 6: “How many people visited your website this week?” Without that number, you’re paying for your site blind. An empty visits chart with a question mark.
9. “Every yes has a fix,” Judo Marketing’s answer: 1, contact forms with an anti-bot filter. 2, you change prices and products. 3, no PHP, with daily backups. 4, Juditos that answer 24/7. 5, guided ads with JuditoADS. 6, visits and sales in your portal.
10. “All of this is fixed one chat away.” If you said yes to any, message us: we’ll tell you honestly if we can help. A “Message us on WhatsApp” button, the number +1 305 934 9981 and judomarketing.net.

## De dónde sale cada dato

Los mismos de la versión en español (`scripts/carrusel/judo-preguntas/texto.md`):
W3Techs para «7 in 10 websites», los boletines de PHP2Shell del 21 de octubre
de 2026 y el código de Judo y de JuditoADS para cada respuesta. Los $5 al día
están por encima del mínimo de $1 de Meta y de JuditoADS.

## Cómo se cambia

```bash
cd scripts/carrusel/judo-preguntas-en
# editar carrusel.html (las láminas están en <main class="tira">)
node revisar.mjs                       # tiene que decir «Sin problemas»
node render.mjs --pdf && python3 hoja.py
```
