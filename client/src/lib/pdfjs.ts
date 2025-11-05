"use client";

// Интерфейс для PDF.js библиотеки
interface PdfjsLib {
  getDocument: (src: string | Uint8Array) => Promise<unknown>;
  GlobalWorkerOptions?: {
    workerSrc?: string;
  };
}

// Загрузка PDF.js через script тег с CDN (надежнее для Next.js)
let pdfjsLibInstance: PdfjsLib | null = null;
let loadingPromise: Promise<PdfjsLib> | null = null;

export default async function getPdfjs(): Promise<PdfjsLib> {
  if (typeof window === "undefined") {
    throw new Error("PDF.js доступен только в браузере");
  }

  if (pdfjsLibInstance) {
    return pdfjsLibInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise<PdfjsLib>((resolve, reject) => {
    // Используем проверенную рабочую версию 3.11.174, которая точно работает с UMD сборкой
    // Эта версия доступна на всех CDN и имеет правильную структуру для script тега
    const version = "3.11.174";
    
    // Проверяем, может быть уже загружен
    interface WindowWithPdfjs extends Window {
      pdfjsLib?: PdfjsLib;
      pdfjs?: PdfjsLib;
      pdfjsDist?: PdfjsLib;
    }
    
    const windowWithPdfjs = window as WindowWithPdfjs;
    const existingPdfjs = windowWithPdfjs.pdfjsLib || windowWithPdfjs.pdfjs;
    if (existingPdfjs) {
      pdfjsLibInstance = existingPdfjs;
      loadingPromise = null;
      resolve(existingPdfjs);
      return;
    }

    // Список CDN для попытки загрузки (в порядке приоритета)
    // Версия 3.11.174 использует старую структуру с pdf.min.js
    const cdnUrls = [
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.min.js`,
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.min.js`,
      `https://unpkg.com/pdfjs-dist@${version}/build/pdf.min.js`,
    ];

    const tryLoadFromCDN = (urlIndex: number) => {
      if (urlIndex >= cdnUrls.length) {
        loadingPromise = null;
        reject(new Error("Не удалось загрузить PDF.js ни с одного CDN"));
        return;
      }

      const scriptUrl = cdnUrls[urlIndex];
      
      // Проверяем, не загружается ли уже скрипт
      const existingScript = document.querySelector(`script[src="${scriptUrl}"]`);
      if (existingScript) {
        // Скрипт уже добавлен, ждем его загрузки
        const checkInterval = setInterval(() => {
          const windowWithPdfjs = window as WindowWithPdfjs;
          const pdfjs = windowWithPdfjs.pdfjsLib || windowWithPdfjs.pdfjs;
          if (pdfjs) {
            clearInterval(checkInterval);
            pdfjsLibInstance = pdfjs;
            if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
              pdfjs.GlobalWorkerOptions.workerSrc = 
                `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
            }
            loadingPromise = null;
            resolve(pdfjs);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          tryLoadFromCDN(urlIndex + 1);
        }, 15000);
        return;
      }

      // Загружаем через script тег (UMD сборка добавляется в window)
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.type = "text/javascript";
      script.async = true;

      const scriptTimeout = setTimeout(() => {
        if (script.parentNode) {
          document.head.removeChild(script);
        }
        // Пробуем следующий CDN
        tryLoadFromCDN(urlIndex + 1);
      }, 15000);

      script.onload = () => {
        clearTimeout(scriptTimeout);
        
        // Ждем немного, чтобы библиотека инициализировалась
        setTimeout(() => {
          // Проверяем разные варианты глобальных переменных
          const windowWithPdfjs = window as WindowWithPdfjs;
          const pdfjs = windowWithPdfjs.pdfjsLib || 
                        windowWithPdfjs.pdfjs ||
                        windowWithPdfjs.pdfjsDist;
          
          if (!pdfjs) {
            // Если библиотека не найдена, пробуем следующий CDN
            if (script.parentNode) {
              document.head.removeChild(script);
            }
            tryLoadFromCDN(urlIndex + 1);
            return;
          }

          // Настраиваем worker
          if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
            // Используем CDN для worker
            pdfjs.GlobalWorkerOptions.workerSrc = 
              `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;
          }

          pdfjsLibInstance = pdfjs;
          loadingPromise = null;
          resolve(pdfjs);
        }, 100);
      };

      script.onerror = () => {
        clearTimeout(scriptTimeout);
        if (script.parentNode) {
          document.head.removeChild(script);
        }
        console.warn(`PDF.js script load error from ${scriptUrl}, trying next CDN...`);
        // Пробуем следующий CDN
        tryLoadFromCDN(urlIndex + 1);
      };

      document.head.appendChild(script);
    };

    // Начинаем загрузку с первого CDN
    tryLoadFromCDN(0);
  });

  return loadingPromise;
}
