#!/usr/bin/env node

/**
 * test_login.js — Teste de credenciais via Playwright headless
 *
 * Uso: node test_login.js --url "https://github.com" --username "user" --password "pass"
 *
 * Retorna em stdout: valid | invalid | incompatible | error:<mensagem>
 * Exit code: sempre 0 (erros são reportados na string de saída)
 * Timeout: 15 segundos por tentativa (não trava)
 */

const { chromium } = require('@playwright/test');

// Parsing de argumentos via --flag value
const args = process.argv.slice(2);
let url = '';
let username = '';
let password = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && i + 1 < args.length) {
    url = args[i + 1];
    i++;
  } else if (args[i] === '--username' && i + 1 < args.length) {
    username = args[i + 1];
    i++;
  } else if (args[i] === '--password' && i + 1 < args.length) {
    password = args[i + 1];
    i++;
  }
}

// Validar argumentos obrigatórios
if (!url) {
  console.log('error:--url é obrigatório');
  process.exit(0);
}

if (!username || !password) {
  console.log('error:--username e --password são obrigatórios');
  process.exit(0);
}

/**
 * Normaliza URL — adiciona protocolo se necessário
 */
function normalizeUrl(u) {
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    return 'https://' + u;
  }
  return u;
}

/**
 * Detecta se há captcha visível na página
 */
function hasCaptcha(page) {
  try {
    const captchaSelectors = [
      '[class*="captcha"]',
      '[id*="captcha"]',
      'iframe[src*="recaptcha"]',
      '[class*="g-recaptcha"]',
      '[id*="g-recaptcha"]',
    ];

    for (const selector of captchaSelectors) {
      const elem = page.locator(selector).first();
      if (elem) {
        // Tentar verificar se é visível
        try {
          if (elem.isVisible()) {
            return true;
          }
        } catch {
          // Elemento encontrado mas visibilidade incerta — assumir que está lá
          return true;
        }
      }
    }
  } catch (e) {
    // Ignorar erros ao procurar captcha
  }
  return false;
}

/**
 * Detecta se há campo TOTP/OTP obrigatório
 */
function hasTOTPField(page) {
  try {
    const totpSelectors = [
      '[name*="otp"]',
      '[name*="totp"]',
      '[placeholder*="code"]',
      '[placeholder*="verification"]',
      '[autocomplete="one-time-code"]',
      '[name*="2fa"]',
    ];

    for (const selector of totpSelectors) {
      const elem = page.locator(selector).first();
      if (elem) {
        try {
          if (elem.isVisible()) {
            return true;
          }
        } catch {
          return true;
        }
      }
    }
  } catch (e) {
    // Ignorar erros
  }
  return false;
}

/**
 * Detecta se há elemento de logout/sign out (indicador de login bem-sucedido)
 */
function hasLogoutElement(page) {
  try {
    const logoutSelectors = [
      '[aria-label*="logout"]',
      '[aria-label*="sign out"]',
      '[href*="logout"]',
      '[href*="signout"]',
      '[href*="sign-out"]',
      '[href*="logoff"]',
      'a[href*="/logout"]',
      'a[href*="/signout"]',
    ];

    for (const selector of logoutSelectors) {
      const elem = page.locator(selector).first();
      if (elem) {
        try {
          if (elem.isVisible()) {
            return true;
          }
        } catch {
          // Elemento encontrado mas visibilidade incerta
          return true;
        }
      }
    }
  } catch (e) {
    // Ignorar erros
  }
  return false;
}

/**
 * Detecta se há mensagem de erro de senha
 * Usa isVisible() que é síncrona em Playwright
 */
function hasErrorMessage(page) {
  try {
    const errorSelectors = [
      '[class*="error"]',
      '[role="alert"]',
      '.error-message',
      '.alert-danger',
      '[class*="invalid"]',
      '[class*="wrong"]',
    ];

    for (const selector of errorSelectors) {
      const elem = page.locator(selector).first();
      if (elem) {
        try {
          // Apenas verificar visibilidade (síncrono)
          if (elem.isVisible()) {
            return true;
          }
        } catch {
          // Ignorar erros ao verificar visibilidade
        }
      }
    }
  } catch (e) {
    // Ignorar erros
  }
  return false;
}

/**
 * Detecta se é um OAuth redirect para provider diferente do domínio original
 */
function isOAuthRedirect(originalUrl, currentUrl) {
  try {
    const origDomain = new URL(originalUrl).hostname;
    const currDomain = new URL(currentUrl).hostname;

    // Detectar OAuth providers comuns
    const oauthProviders = [
      'accounts.google.com',
      'github.com',
      'api.github.com',
      'login.live.com',
      'login.microsoftonline.com',
      'appleid.apple.com',
      'login.facebook.com',
      'twitter.com',
      'accounts.twitter.com',
      'linkedin.com',
    ];

    // Se redirecionou para um provider OAuth e não é o mesmo domínio original
    if (oauthProviders.includes(currDomain) && currDomain !== origDomain) {
      return true;
    }
  } catch (e) {
    // Ignorar erros ao comparar URLs
  }
  return false;
}

/**
 * Executa teste de login via Playwright
 */
async function testLogin() {
  let browser;
  try {
    // Inicializar browser com timeout global de 15s
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Timeout global para todas as operações
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);

    const normalizedUrl = normalizeUrl(url);

    try {
      // Navegar para a página
      await page.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    } catch (e) {
      // Se não conseguir navegar, pode ser que a URL seja inválida ou site está down
      await browser.close();
      console.log('error:não foi possível acessar a URL');
      process.exit(0);
    }

    // Detectar OAuth redirect imediatamente
    if (isOAuthRedirect(normalizedUrl, page.url())) {
      await browser.close();
      console.log('incompatible');
      process.exit(0);
    }

    // Detectar captcha
    if (hasCaptcha(page)) {
      await browser.close();
      console.log('incompatible');
      process.exit(0);
    }

    // Procurar campo de username/email e preencher
    const usernameSelectors = [
      'input[name="login"]',
      'input[name="email"]',
      'input[name="username"]',
      'input[name="user"]',
      'input[id="login"]',
      'input[id="email"]',
      'input[id="username"]',
      'input[type="email"]',
      'input[type="text"][placeholder*="email" i]',
      'input[type="text"][placeholder*="user" i]',
      'input[type="text"][placeholder*="login" i]',
    ];

    let filled = false;
    for (const selector of usernameSelectors) {
      try {
        const elem = page.locator(selector).first();
        if (elem && await elem.isVisible()) {
          await elem.fill(username);
          filled = true;
          break;
        }
      } catch (e) {
        // Continuar para o próximo seletor
      }
    }

    if (!filled) {
      // Não conseguiu encontrar campo de username — incompatível
      await browser.close();
      console.log('incompatible');
      process.exit(0);
    }

    // Procurar botão de submit ou "Next" e clicar
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Login")',
      'button:has-text("Continue")',
      'button:has-text("Next")',
      'input[type="submit"]',
      'button[id*="submit"]',
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const elem = page.locator(selector).first();
        if (elem && await elem.isVisible()) {
          await elem.click();
          submitted = true;
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    if (!submitted) {
      // Não conseguiu encontrar botão de submit
      await browser.close();
      console.log('incompatible');
      process.exit(0);
    }

    // Aguardar 2 segundos para a página reagir
    await page.waitForTimeout(2000);

    // Verificar se redirecionou para OAuth
    if (isOAuthRedirect(normalizedUrl, page.url())) {
      await browser.close();
      console.log('incompatible');
      process.exit(0);
    }

    // Detectar TOTP obrigatório
    if (hasTOTPField(page)) {
      await browser.close();
      console.log('incompatible');
      process.exit(0);
    }

    // Procurar campo de senha (só aparece após preencher username em muitos sites)
    const passwordSelectors = [
      'input[name="password"]',
      'input[name="passwd"]',
      'input[name="pass"]',
      'input[id="password"]',
      'input[type="password"]',
    ];

    let passwordFound = false;
    for (const selector of passwordSelectors) {
      try {
        const elem = page.locator(selector).first();
        if (elem && await elem.isVisible()) {
          await elem.fill(password);
          passwordFound = true;
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    if (passwordFound) {
      // Procurar e clicar botão de submit novamente
      for (const selector of submitSelectors) {
        try {
          const elem = page.locator(selector).first();
          if (elem && await elem.isVisible()) {
            await elem.click();
            break;
          }
        } catch (e) {
          // Continuar
        }
      }

      // Aguardar navegação ou mudança de estado
      try {
        await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
      } catch (e) {
        // Ignorar erro de timeout
      }

      // Aguardar mais 2 segundos para DOM estabilizar
      await page.waitForTimeout(2000);
    }

    // CHECAGEM FINAL de sucesso/falha

    // 1. Verificar se URL mudou para path autenticado (não contém login/signin/auth)
    const finalUrl = page.url();
    const isAuthPath = !/(login|signin|sign-in|auth|authenticate)/i.test(finalUrl);

    // 2. Verificar logout element (indica sucesso)
    const hasLogout = hasLogoutElement(page);

    // 3. Verificar erro de senha
    const hasError = await hasErrorMessage(page);

    // 4. Verificar captcha (pode aparecer após submit)
    if (hasCaptcha(page)) {
      await browser.close();
      console.log('incompatible');
      process.exit(0);
    }

    // 5. Verificar TOTP novamente
    if (hasTOTPField(page)) {
      await browser.close();
      console.log('incompatible');
      process.exit(0);
    }

    // Decidir resultado
    if (hasLogout || isAuthPath) {
      // Indicadores de sucesso
      await browser.close();
      console.log('valid');
      process.exit(0);
    } else if (hasError) {
      // Erro de credenciais
      await browser.close();
      console.log('invalid');
      process.exit(0);
    } else {
      // Timeout ou estado incerto — assumir falha
      await browser.close();
      console.log('invalid');
      process.exit(0);
    }

  } catch (error) {
    // Qualquer erro não previsto
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // Ignorar erro ao fechar
      }
    }
    console.log(`error:${error.message}`);
    process.exit(0);
  }
}

// Executar teste
testLogin();
