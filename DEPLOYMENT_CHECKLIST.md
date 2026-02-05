# MetalWeigh - Checklist de Despliegue en Vercel

## 🔴 PROBLEMAS ENCONTRADOS Y CORREGIDOS

### 1. Redirect Permanente
- **Problema:** `next.config.ts` tenía `redirects()` con `permanent: true`
- **Solución:** ✅ Removido - Usamos middleware en su lugar

### 2. Page.tsx Incorrecta
- **Problema:** Intentaba usar `redirect()` sin ser un Client Component
- **Solución:** ✅ Cambiada a componente simple de loading

### 3. Middleware Incompleto
- **Problema:** No redirigía `/` a Login correctamente
- **Solución:** ✅ Agregadas redirecciones para `/` y manejo de variables vacías

### 4. Variables de Entorno No Validadas
- **Problema:** Sin variables = middleware se saltaba, renderizaba página genérica
- **Solución:** ✅ Ahora el middleware redirige a login si no encuentra variables

---

## ✅ CHECKLIST ANTES DE DESPLEGAR

### 1. VARIABLES DE ENTORNO EN VERCEL (CRÍTICO)

Accede a tu proyecto en Vercel y añade EXACTAMENTE estas variables en Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi... (tu anon key)
```

- [ ] `NEXT_PUBLIC_SUPABASE_URL` está configurada
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` está configurada
- [ ] Ambas variables son para Production (no solo para Preview)

**¿Dónde encontrar estas variables?**
1. Ve a [supabase.com](https://supabase.com)
2. Abre tu proyecto
3. Settings → API
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. VERIFICAR ARCHIVOS

- [ ] `src/middleware.ts` tiene la redirección correcta
- [ ] `src/app/page.tsx` es un componente de loading simple
- [ ] NO existe archivo `src/middleware.ts.bak`
- [ ] `next.config.ts` NO tiene un bloque `redirects()`

Verifica con:
```powershell
grep -r "redirects()" src/
grep -r "middleware.ts.bak" src/
```

### 3. VERIFICAR DATABASE

- [ ] Tu base de datos Supabase existe
- [ ] Tabla `auth.users` está creada
- [ ] Tabla `public.users` existe (si la usas en Prisma)
- [ ] Migraciones Prisma están ejecutadas:
  ```bash
  npx prisma migrate deploy
  ```

### 4. VERCEL BUILD

Después de push en GitHub:

- [ ] Vercel detecta los cambios
- [ ] Build completa sin errores
- [ ] Deployment es exitoso (sin errores en Overview tab)

**Si el build falla:**
- Abre la pestaña "Build" en Vercel
- Busca errores específicos
- Los errores usuales son:
  - Variables de entorno faltantes
  - Migraciones de Prisma pendientes
  - TypeScript errors

### 5. PRUEBA LOCAL CON VARIABLES

Antes de desplegar, prueba localmente:

```bash
# Crear archivo .env.local
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Ejecutar en desarrollo
npm run dev

# Ir a http://localhost:3000
# Deberías ver el login, NO la página de "NEXT.js To get started..."
```

- [ ] Local: `http://localhost:3000` muestra login
- [ ] Local: `http://localhost:3000/dashboard` redirige a login si no estoy autenticado
- [ ] Local: Puedo hacer login con un usuario válido
- [ ] Local: Después de login, accedo a dashboard

---

## 🔍 DIAGNOSIS: CÓMO SABER QUÉ ESTÁ MAL

### Si ves la página "NEXT.js To get started...":
1. **Problema:** Middleware no está funcionando O variables no están configuradas
2. **Solución:** 
   - Verifica variables de entorno en Vercel
   - Haz un re-deployment (Deploy button en Vercel)
   - Espera a que la compilación termine

### Si ves el loading "Redirigiendo...":
1. **Buena señal:** Middleware está funcionando
2. **Problemas posibles:**
   - Supabase no responde (timeout)
   - Middleware tiene error (check logs)
   - Login aún no carga

### Si ves un error en la consola del navegador:
1. Abre DevTools (F12)
2. Tab "Console" 
3. Busca errores rojo
4. Si dice "Supabase URL or Key missing" → Configura variables en Vercel

---

## 📊 FLUJO CORRECTO DE AUTENTICACIÓN

```
Usuario accede a https://metalweigh.vercel.app
            ↓
    Middleware ejecuta
            ↓
    ¿Tiene variable de entorno NEXT_PUBLIC_SUPABASE_URL?
       NO → Redirige a /login (página mostrará error)
       SÍ ↓
    ¿Está autenticado (token en cookie)?
       NO → Redirige a /login
       SÍ ↓
    ¿Accediendo a / (raíz)?
       SÍ → Redirige a /dashboard
       NO ↓
    Renderiza página solicitada
```

---

## 🚨 ÚLTIMA OPCIÓN: RESETEAR TODO

Si nada funciona:

1. Desconecta el repo de Vercel
2. En GitHub, elimina el deployment token
3. Vuelve a conectar el repo a un nuevo proyecto Vercel
4. Añade variables de entorno
5. Haz push a una rama nueva
6. Deploy nuevamente

---

## 💬 LOGS IMPORTANTES

Para ver qué está pasando:

**En Vercel:**
- Settings → Function Logs → Habilitar logs
- Accede a tu app
- Ve los logs en tiempo real

**En el navegador:**
- F12 → Console
- F12 → Network
- Busca requests a `NEXT_PUBLIC_SUPABASE_URL`

---

## ❌ ERRORES COMUNES

| Error | Causa | Solución |
|-------|-------|----------|
| "Forbidden" en Supabase | Anon key incorrecta | Copia nuevamente de supabase.com |
| "401 Unauthorized" | URL de Supabase incorrecta | Verifica URL en Settings → API |
| "Cannot read properties" | Variables no cargadas | Espera a que re-compile |
| CORS error | Supabase no permite origin | Configura CORS en Supabase |
| "Redirigiendo..." infinito | Middleware loop | Check `middleware.ts` |

---

**Actualizado:** 2026-02-05
