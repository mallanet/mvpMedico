# Spec: Calculadora de pérdida por no-show

**Feature ID:** 003-no-show-calculator  
**Issue:** (enganche marketing)  
**Owner:** christianmock  
**Estado:** hecho

## Problema

Médicos y clínicas subestiman cuánto dinero pierden por citas no-show (pacientes que no asisten ni cancelan). Sin una proyección concreta y conservadora, la membresía Waira ($100 USD/mes) se percibe cara frente a un dolor que no ven cuantificado. Además, el valor de recordatorios, reconfirmación, pago anticipado y lista de espera no es tangible hasta que hay números.

## Outcome

Existe una calculadora pública (teaser en home + página `/calculadora`) donde el consultorio ingresa tarifa y volumen, ve pérdida diaria/semanal/mensual por no-shows, una proyección conservadora de recuperación con un sistema de recordatorios, y compara ese monto con la membresía Waira. El copy educa sobre el flujo objetivo (pago, 6h/3h, 1h, waitlist) sin afirmar que SMS/push ya están en producción.

## Historias / escenarios

1. **Como** médico visitante **quiero** estimar cuánto pierdo al mes por no-shows **para** decidir si vale la pena la membresía.
2. **Como** clínica **quiero** ver un escenario conservador de recuperación **para** no sentir que me están vendiendo cifras fantasiosas.
3. **Como** visitante **quiero** entender el flujo de recordatorios/pago/lista de espera **para** visualizar cómo se recupera el cupo.
4. **Como** visitante en la home **quiero** un teaser rápido **para** abrir la calculadora completa sin fricción.

## Requisitos funcionales

- [x] Inputs: tarifa USD, no-shows conocidos/día; días laborables/semana, semanas/mes, min/consulta (página completa). Tasa industria (~18–23%) solo informativa.
- [x] Resultados en vivo: pérdida día/semana/mes; recuperación principal 25% con banda 20–30%; ROI vs $100/mes; minutos liberados
- [x] Teaser en `/` con inputs mínimos + link a `/calculadora`
- [x] Página `/calculadora` con formulario completo, timeline educativa, disclaimer y fuentes
- [x] Link “Calculadora” en nav pública
- [x] CTA a `/signup` y secundario a `/preview`
- [x] Copy honesto: proyección / flujo objetivo, no “ya activo en tu cuenta”

## Fuera de alcance

- SMS, WhatsApp, push, lista de espera o cobro anticipado reales
- Persistencia, auth o analytics de leads
- Cambios a `base.md` §7 (mensajería sigue fuera del MVP operativo)
- Multi-moneda (solo USD en v1)

## Datos / entidades tocadas

- Ninguna tabla Supabase
- Rutas: `/`, `/calculadora`
- Módulo puro `src/lib/calculator/no-show-model.ts`
- Componente client `src/components/calculator/no-show-calculator.tsx`

## Criterios de aceptación

- [x] Caso fijo documentado: fee 40, 10 citas/día, 18% → pérdida y recuperación coherentes con el modelo
- [x] Fuentes visibles (SLR ~23%, Cochrane SMS)
- [x] Desktop y móvil legibles; sin afirmar features de mensajería ya shippeadas
- [x] Otro del trio puede continuar sin setup personal del autor

## Notas abiertas

- Owner placeholder `christianmock` si el Issue se asigna distinto, actualizar en PR.
