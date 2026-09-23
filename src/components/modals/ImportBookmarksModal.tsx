import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCode,
  Sparkles,
  FolderTree,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  X,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { FolderOption } from '../../hooks/useBookmarks';
import { parseNetscapeHtml, ParseHtmlResult } from '../../services/backup/htmlParser';
import { importBookmarks, ImportStrategy } from '../../services/backup/importer';

interface ImportBookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: FolderOption[];
  onRefreshTree?: () => Promise<void>;
}

export const ImportBookmarksModal: React.FC<ImportBookmarksModalProps> = ({
  isOpen,
  onClose,
  folders,
  onRefreshTree,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileType, setFileType] = useState<'html' | 'json'>('html');
  const [parsedData, setParsedData] = useState<ParseHtmlResult | null>(null);
  const [strategy, setStrategy] = useState<ImportStrategy>('ai_organize');

  // Options
  const [destinationFolderId, setDestinationFolderId] = useState<string>('1');
  const [createDedicatedFolder, setCreateDedicatedFolder] = useState<boolean>(true);
  const [dedicatedFolderName, setDedicatedFolderName] = useState<string>(
    `Importados (${new Date().toLocaleDateString('pt-BR')})`
  );

  // Execution state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number; currentItem: string } | null>(null);
  const [result, setResult] = useState<{ imported: number; folders: number; snapshotId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setFileContent('');
    setParsedData(null);
    setIsProcessing(false);
    setProgress(null);
    setResult(null);
    setError(null);
  };

  const handleClose = () => {
    if (isProcessing) return;
    resetState();
    onClose();
  };

  const processLoadedFile = (content: string, filename: string) => {
    try {
      const isJson = filename.endsWith('.json');
      setFileType(isJson ? 'json' : 'html');
      setFileContent(content);

      if (isJson) {
        const jsonData = JSON.parse(content);
        const rawTree = Array.isArray(jsonData.tree) ? jsonData.tree : Array.isArray(jsonData) ? jsonData : [];
        let totalBookmarks = 0;
        let totalFolders = 0;
        const flatBookmarks: any[] = [];

        function count(nodes: any[], currentPath: string) {
          for (const n of nodes) {
            const nextPath = currentPath ? `${currentPath} / ${n.title}` : n.title;
            if (n.url) {
              totalBookmarks++;
              flatBookmarks.push({ title: n.title, url: n.url, path: currentPath });
            } else {
              totalFolders++;
              if (n.children) count(n.children, nextPath);
            }
          }
        }
        count(rawTree, '');

        setParsedData({
          totalBookmarks,
          totalFolders,
          rootNodes: [],
          flatBookmarks,
        });
      } else {
        // Parse HTML
        const parsed = parseNetscapeHtml(content);
        setParsedData(parsed);
      }
      setError(null);
    } catch (e: any) {
      setError(`Falha ao ler arquivo: ${e?.message || 'Formato inválido'}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processLoadedFile(content, selected.name);
    };
    reader.readAsText(selected, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    setFile(droppedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processLoadedFile(content, droppedFile.name);
    };
    reader.readAsText(droppedFile, 'UTF-8');
  };

  const handleStartImport = async () => {
    if (!fileContent || !parsedData) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProgress({ current: 0, total: parsedData.totalBookmarks, currentItem: 'Preparando importação...' });

      const res = await importBookmarks({
        fileContent,
        fileType,
        strategy,
        destinationParentId: destinationFolderId,
        createDedicatedFolder,
        dedicatedFolderName,
        onProgress: (current, total, currentItem) => {
          setProgress({ current, total, currentItem });
        },
      });

      if (res.success) {
        setResult({
          imported: res.totalBookmarksImported,
          folders: res.totalFoldersCreated,
          snapshotId: res.snapshotId,
        });
        if (onRefreshTree) {
          await onRefreshTree();
        }
      } else {
        setError(res.error || 'Erro durante a importação');
      }
    } catch (err: any) {
      setError(err?.message || 'Falha crítica na importação');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar Favoritos (HTML / JSON)"
      maxWidth="xl"
    >
      <div className="space-y-4 text-xs">
        {/* Step 1: Upload Dropzone if no file selected */}
        {!file && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/50"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".html,.htm,.json"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-950/80 flex items-center justify-center text-sky-600 dark:text-sky-400 mb-3 shadow-sm">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">
              Arraste seu arquivo de favoritos aqui
            </h4>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-3">
              Suporta arquivos padrão <strong>.html</strong> (exportados do Edge, Chrome, Safari ou Firefox) e backups <strong>.json</strong>.
            </p>
            <button
              type="button"
              className="px-3.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg font-medium transition-colors shadow-2xs"
            >
              Selecionar do Computador
            </button>
          </div>
        )}

        {/* Step 2: File loaded and preview */}
        {file && !result && (
          <div className="space-y-4">
            {/* File info bar */}
            <div className="flex items-center justify-between p-3 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-900 rounded-xl">
              <div className="flex items-center space-x-2.5 min-w-0">
                <FileCode className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {(file.size / 1024).toFixed(1)} KB • {fileType.toUpperCase()}
                  </span>
                </div>
              </div>

              {!isProcessing && (
                <button
                  type="button"
                  onClick={resetState}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                  title="Trocar arquivo"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Analysis Summary */}
            {parsedData && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400 block">
                    {parsedData.totalBookmarks.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Favoritos Detectados
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 block">
                    {parsedData.totalFolders.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pastas no Arquivo
                  </span>
                </div>
              </div>
            )}

            {/* Strategy Selection */}
            {!isProcessing && (
              <div className="space-y-2">
                <label className="block font-semibold text-slate-800 dark:text-slate-200">
                  Como você deseja organizar esses favoritos importados?
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: AI Organize */}
                  <div
                    onClick={() => setStrategy('ai_organize')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      strategy === 'ai_organize'
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/60 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5 text-sky-600 dark:text-sky-400 font-bold mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span>Organizar com IA & Heurística</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Limpa títulos poluídos e categoriza tudo semanticamente nas pastas ideais (Desenvolvimento, Estudos, Jogos, Finanças, etc.).
                      </p>
                    </div>
                    <span className="text-[10px] mt-2 font-semibold text-sky-700 dark:text-sky-300">
                      Recomendado para arquivos volumosos
                    </span>
                  </div>

                  {/* Option 2: Preserve original */}
                  <div
                    onClick={() => setStrategy('preserve')}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      strategy === 'preserve'
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/60 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-1.5 text-amber-600 dark:text-amber-400 font-bold mb-1">
                        <FolderTree className="w-4 h-4" />
                        <span>Manter Estrutura Original</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        Recria exatamente as mesmas pastas e subpastas existentes no arquivo importado, preservando sua organização atual.
                      </p>
                    </div>
                    <span className="text-[10px] mt-2 font-semibold text-amber-700 dark:text-amber-300">
                      Importação direta sem alterações
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Destination Configuration */}
            {!isProcessing && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Destino da Importação
                  </label>
                  <select
                    value={destinationFolderId}
                    onChange={(e) => setDestinationFolderId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  >
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.path || f.title}
                      </option>
                    ))}
                  </select>
                </div>

                {strategy === 'preserve' && (
                  <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createDedicatedFolder}
                        onChange={(e) => setCreateDedicatedFolder(e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        Agrupar em uma pasta dedicada de importação
                      </span>
                    </label>

                    {createDedicatedFolder && (
                      <input
                        type="text"
                        value={dedicatedFolderName}
                        onChange={(e) => setDedicatedFolderName(e.target.value)}
                        placeholder="Nome da pasta..."
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Safety Alert */}
            <div className="flex items-center space-x-2 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>
                Um snapshot de segurança será gerado antes de iniciar. Você poderá desfazer a qualquer momento.
              </span>
            </div>

            {/* Progress Bar during execution */}
            {isProcessing && progress && (
              <div className="space-y-2 p-3 bg-sky-50 dark:bg-sky-950/60 rounded-xl border border-sky-200 dark:border-sky-900 animate-in fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-900 dark:text-sky-200 flex items-center space-x-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                    <span>Processando e importando favoritos...</span>
                  </span>
                  <span className="font-mono text-sky-800 dark:text-sky-300">
                    {progress.current} / {progress.total} ({Math.round((progress.current / (progress.total || 1)) * 100)}%)
                  </span>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-500 h-full transition-all duration-150 ease-out"
                    style={{ width: `${(progress.current / (progress.total || 1)) * 100}%` }}
                  />
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  {progress.currentItem}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Success Result */}
        {result && (
          <div className="p-6 text-center space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Importação Concluída com Sucesso!
            </h3>

            <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto text-xs leading-relaxed">
              Foram importados <strong>{result.imported} favoritos</strong> e organizados em <strong>{result.folders} pastas</strong> no Microsoft Edge.
            </p>

            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] text-slate-500 dark:text-slate-400 inline-block">
              Snapshot de segurança salvo: <span className="font-mono">{result.snapshotId}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          {!result ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="px-3.5 py-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>

              {file && (
                <button
                  type="button"
                  onClick={handleStartImport}
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors flex items-center space-x-1.5 disabled:opacity-50 shadow-xs"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Importando...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Iniciar Importação</span>
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors shadow-xs"
            >
              Concluir & Ver Favoritos
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
