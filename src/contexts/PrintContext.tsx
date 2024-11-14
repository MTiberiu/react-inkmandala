// contexts/PrintContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import printJS from 'print-js';

interface PrintContextType {
    handlePrintPDF: (printImage: string) => void;
    handlePrintAllPDF: (images: string[]) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export const PrintProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const handlePrintPDF = (printImage: string) => {
        printJS({
            printable: printImage,
            type: 'image',
            style: `
                @page { margin: 0; }
                img {
                  width: 100%;
                  margin: 0;
                  display: block;
                  padding: 0;
                }
                body, html {
                  margin: 0;
                  padding: 0;
                  height: 100%;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  text-align: center;
                }
            `
        });
    };

    const handlePrintAllPDF = (images: string[]) => {
        // Creează un HTML temporar pentru toate imaginile
        const printHTML = images.map((src: string) => `
          <div class="page-container">
            <img src="${src}" />
          </div>
        `).join('');

        // Folosește printJS pentru a printa HTML-ul generat
        printJS({
            printable: printHTML,
            type: 'raw-html',
            style: `
                @page { margin: 0; }
                @media print {
                    body, html {
                        margin: 0;
                        padding: 0;
                        height: 100%;
                        width: 100%;
                    }
                    .page-container {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        overflow: hidden;
                    }
                    img {
                        display: block;
                        width: 100%;
                        height: auto;
                        page-break-after: always;
                    }
                }
            `,
        });
    };

    return (
        <PrintContext.Provider value={{ handlePrintPDF, handlePrintAllPDF }}>
            {children}
        </PrintContext.Provider>
    );
};

export const usePrint = (): PrintContextType => {
    const context = useContext(PrintContext);
    if (!context) {
        throw new Error("usePrint must be used within a PrintProvider");
    }
    return context;
};
