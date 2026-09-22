import { AiBookmarkItem } from './types';

export function buildCategorizationPrompt(items: AiBookmarkItem[]): string {
  const simplified = items.map((i) => ({
    id: i.id,
    title: i.title,
    url: i.url,
  }));

  return `Você é um assistente especialista em taxonomia e organização de favoritos web.
Analise a lista de favoritos e classifique cada item com extrema precisão em uma das seguintes categorias e subpastas inteligentes (use o formato "Categoria Principal / Subpasta"):

REGRAS DE CATEGORIZAÇÃO HIERÁRQUICA:

1. "Jogos & Games" (NUNCA misturar com Filmes ou Músicas):
   - "Jogos & Games / Sony & PlayStation": PS1, PS2, PS3, PS4, PS5, GT6, Gran Turismo, exclusivos PlayStation, downloads PSX.
   - "Jogos & Games / Nintendo": Switch, Wii, GameCube, N64, 3DS, DS, SNES, Zelda, Mario, Pokémon, Metroid.
   - "Jogos & Games / Xbox": Xbox 360, Xbox One, Series X/S, Game Pass, Halo, Forza.
   - "Jogos & Games / PC & Lojas": Steam, Epic Games, GOG, FitGirl, itch.io, Roblox, Minecraft, Path of Exile.
   - "Jogos & Games / Mods & Comunidade": Nexus Mods, MixMods, CurseForge, Modrinth, shaders, ENB, SKSE, MUGEN.
   - "Jogos & Games / Wikis, Guias & Databases": Wikis, guias, builds, PoE2DB, Maxroll, mobalytics, detonados, cheats.
   - "Jogos & Games / Emuladores & ROMs": RetroArch, RPCS3, PCSX2, PPSSPP, ROMs, BIOS, ISOs, Vimm's Lair.
   - "Jogos & Games / Outros Games": Jogos diversos não cobertos acima.

2. "Programação, Dev & IA" (Unificar Programação, Dev e IA nesta mesma pasta):
   - "Programação, Dev & IA / Inteligência Artificial": Claude, ChatGPT, OpenAI, Ollama, Hugging Face, LLMs, Gemini, Stable Diffusion, DeepSeek, Suno, Kaggle, agentes de IA.
   - "Programação, Dev & IA / Repositórios & Código": GitHub, GitLab, Bitbucket, gists, SourceForge.
   - "Programação, Dev & IA / Comunidade & Dúvidas": Stack Overflow, Stack Exchange, fóruns de programadores.
   - "Programação, Dev & IA / Documentações & Guias": MDN, Microsoft Learn, DevMedia, W3Schools, devdocs, tutoriais e apostilas de programação (C, C++, C#, Python, JS, TypeScript, etc.).
   - "Programação, Dev & IA / Ferramentas & Dev Geral": Docker, APIs, SDKs, VS Code, Vercel, ferramentas de infra e bancos de dados.

3. "Eletroeletrônica" (Tudo de elétrica e eletrônica):
   - "Eletroeletrônica / Microcontroladores & DIY": Arduino, ESP32, ESP8266, Raspberry Pi, sistemas embarcados.
   - "Eletroeletrônica / Circuitos & Esquemas": KiCad, EasyEDA, Proteus, Fritzing, simulação de circuitos, diagramas.
   - "Eletroeletrônica / Componentes & Datasheets": AllDataSheet, Mouser, DigiKey, transistores, resistores, capacitores, CI, diodos.
   - "Eletroeletrônica / Instalações Elétricas & Aterramento": Aterramento, disjuntores, quadros elétricos, diagramas unifilares, energia solar, inversores, cabos e bitolas.
   - "Eletroeletrônica / Geral": Elétrica e eletrônica geral.

4. "Mecânica & Engenharia":
   - "Mecânica & Engenharia / Automotiva & Veículos": Carros, motos, caminhões, Scania, Iveco, Volvo, tratores, oficina, motores, suspensão, freios, pneus.
   - "Mecânica & Engenharia / Técnico Mecânico & Inspeção": Inspeção veicular, manutenção preventiva, normas técnicas ABNT/DIN, SENAI.
   - "Mecânica & Engenharia / Usinagem & Ferramentas Pesadas": Torno, fresa, CNC, retífica, retroescavadeiras, motoniveladoras, manuais técnicos (Mundo Manuais).
   - "Mecânica & Engenharia / CAD 3D & Modelagem": SolidWorks, AutoCAD, Fusion 360, GrabCAD, Thingiverse, modelagem 3D.
   - "Mecânica & Engenharia / Geral": Mecânica em geral.

5. "Música" (NUNCA misturar com Filmes ou Games):
   - "Música / CCB & Hinários": Hinários CCB, hinos sacros, reuniões de jovens, ensaios.
   - "Música / Instrumentos & Luthiaria": Violino, viola clássica, violão, piano, arcos, cravelhas, cordas, luthier.
   - "Música / Partituras & Cifras": Cifra Club, partituras, tablaturas, Songsterr, Ultimate Guitar.
   - "Música / Teoria & Solfejo": Solfejo, Bona, Pozzoli, harmonia musical, escalas, afinação 440Hz.
   - "Música / Streaming & Clássica": Spotify, Deezer, YouTube Music, orquestras, filarmônicas, Bach, concertos.
   - "Música / Geral": Música em geral.

6. "Estudos & Educação":
   - "Estudos & Educação / Cursos & Concursos": Concursos públicos, ENEM, Fuvest, vestibulares, Qconcursos, PortalEduca, SEST SENAT.
   - "Estudos & Educação / Biblioteca & Livros (PDF)": Scribd, PDFCoffee, Archive.org, Google Livros, BVirtual, apostilas.
   - "Estudos & Educação / Faculdades & Formação Técnica": Faculdades, Uninter, Estácio, Senac, certificação por competência, IETAAM, EAD.
   - "Estudos & Educação / Idiomas & Gramática": Inglês, gramática da língua portuguesa, conjugação de verbos, vocabulário.
   - "Estudos & Educação / Ciências Exatas": Matemática, física, química, cálculo, Scilab, Maxima, MATLAB.
   - "Estudos & Educação / Humanas & Filosofia": Filosofia, história, sociologia, geografia.
   - "Estudos & Educação / Artigos & Normas Técnicas": SciELO, Google Scholar, ABNT, teses e dissertações.
   - "Estudos & Educação / Biologia & Ciências": Biologia, botânica, zoologia.
   - "Estudos & Educação / Geral": Educação em geral.

7. "Tecnologia & Informática":
   - "Tecnologia & Informática / Android & Dispositivos Móveis": Smartphones, Samsung, Motorola, Xiaomi, APKs, Root, Magisk, custom ROMs, XDA.
   - "Tecnologia & Informática / Windows & Sistemas": Windows, formatação, drivers, PowerShell, atalhos de sistema.
   - "Tecnologia & Informática / Hardware & Componentes": Processadores, placas de vídeo, memória RAM, SSDs, Clube do Hardware, HWiNFO.
   - "Tecnologia & Informática / Redes & Segurança": Roteadores (192.168.1.1), Wi-Fi, DNS, acesso remoto (AnyDesk, AirDroid), segurança e antivírus.

8. "Saúde, Fitness & Bem-Estar":
   - "Saúde, Fitness & Bem-Estar / Suplementos & Nutrição": Creatina, Whey, Growth, vitaminas, nutrição.
   - "Saúde, Fitness & Bem-Estar / Fitness & Treinos": Musculação, treinos de academia, emagrecimento, exercícios.
   - "Saúde, Fitness & Bem-Estar / Receitas Saudáveis": Dietas, sucos, chás, alimentação saudável.
   - "Saúde, Fitness & Bem-Estar / Medicina & Cuidados": Tua Saúde, hospitais, exames, cuidados com a saúde, sintomas, remédios.

9. "Negócios & Carreira":
   - "Negócios & Carreira / Finanças & Investimentos": Bancos (Itaú, Nubank, Mercado Pago), B3, investimentos, ações, consórcios, financiamentos.
   - "Negócios & Carreira / Empreendedorismo & Marcas": MEI, CNPJ, Sebrae, registro de marcas no INPI, vendas B2B.
   - "Negócios & Carreira / Empregos & Oportunidades": Vagas de emprego, currículos, Universia, oportunidades de trabalho.

10. "Espiritualidade & Religião":
    - "Espiritualidade & Religião / Estudos Bíblicos & Fé": Bíblia, versículos, teologia, apologética, estudos bíblicos.
    - "Espiritualidade & Religião / Astrologia, Cabala & Numerologia": Mapa astral, signos, cabala, numerologia, gematria.
    - "Espiritualidade & Religião / Misticismo, Sonhos & Filosofia": Significado de sonhos, Rosacruz (AMORC), espiritismo, reflexões espirituais.

11. "Governo & Cidadania":
    - "Governo & Cidadania / Detran & Trânsito": Detran, CNH, IPVA, multas, veículos.
    - "Governo & Cidadania / Serviços Públicos & Cidadania": Gov.br, Receita Federal, prefeituras, diário oficial, cidadania.

12. "Filmes, Séries & Animes":
    - "Filmes, Séries & Animes / Animes & Cultura Japonesa": Animes, Crunchyroll, mangás, cultura pop.
    - "Filmes, Séries & Animes / Streaming & Players": Netflix, Prime Video, Stremio, Plex, Jellyfin, catálogos.
    - "Filmes, Séries & Animes / Torrents & Downloads": Sites de torrents de vídeos e downloads de multimídia.

13. "Arte, Design & Personalização":
    - "Arte, Design & Personalização / Personalização, Ícones & Wallpapers": Custom Cursor, ícones SVG, papéis de parede, Rainmeter.
    - "Arte, Design & Personalização / Arquitetura & Construção": Plantas baixas, arquitetura, design de interiores.
    - "Arte, Design & Personalização / Design Gráfico & Ferramentas 3D": Canva, Inkscape, Blender, modelos 3D.
    - "Arte, Design & Personalização / Quadrinhos & HQs": HQs, quadrinhos, Marvel, DC, fanzines.

14. "Lojas & Compras":
    - "Lojas & Compras / Tecnologia & Hardware": Pichau, KaBuM!, Terabyte, eletrônicos.
    - "Lojas & Compras / Perfumaria & Cuidados": Perfumes, cosméticos, fragrâncias.
    - "Lojas & Compras / Cupons, Ofertas & Comparadores": Pelando, Promobit, Zoom, cupons de desconto.
    - "Lojas & Compras / Marketplaces & Lojas Gerais": Mercado Livre, Amazon, Shopee, AliExpress, Casas Bahia.

15. "Turismo, Viagens & Eventos": Voos, hotéis, passagens, Booking, Airbnb, eventos, ingressos.
16. "Redes Sociais & Comunicação": WhatsApp, Telegram, Discord, Instagram, LinkedIn, Reddit, Gmail.
17. "Produtividade & Ferramentas": Google Drive, planilhas, PDFs (iLovePDF, SmallPDF), conversores, ferramentas web.
18. "Notícias & Atualidades": Portais de notícias (G1, UOL, CNN, Folha).

Favoritos a classificar:
${JSON.stringify(simplified, null, 2)}

RESPONDA EXCLUSIVAMENTE UM OBJETO JSON no formato:
{
  "classifications": [
    {
      "id": "id_do_favorito",
      "suggestedFolder": "Categoria Principal / Subpasta Sugerida",
      "suggestedTitle": "Título Limpo (opcional)",
      "confidence": 0.95
    }
  ]
}`;
}
