import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      content: 'Halo! Saya asisten virtual Schola. Ada yang bisa saya bantu terkait pengajuan surat akademik?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const quickQuestions = [
    'Bagaimana cara mengajukan surat?',
    'Berapa lama proses verifikasi?',
    'Apa saja persyaratan surat keterangan aktif?',
    'Bagaimana cara melacak status pengajuan?'
  ];

  const handleSend = (message: string = inputMessage) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate bot response
    setTimeout(() => {
      let botResponse = '';

      if (message.toLowerCase().includes('cara mengajukan')) {
        botResponse = 'Untuk mengajukan surat, silakan login terlebih dahulu, kemudian pilih menu Pengajuan → Ajuan. Pilih jenis surat yang Anda butuhkan, lengkapi formulir, dan submit pengajuan Anda.';
      } else if (message.toLowerCase().includes('berapa lama') || message.toLowerCase().includes('proses verifikasi')) {
        botResponse = 'Waktu proses verifikasi bervariasi tergantung jenis surat: Surat Keterangan Aktif (2-3 hari kerja), Surat Izin Penelitian (3-5 hari kerja), Surat Cuti Akademik (5-7 hari kerja).';
      } else if (message.toLowerCase().includes('persyaratan') || message.toLowerCase().includes('keterangan aktif')) {
        botResponse = 'Persyaratan Surat Keterangan Aktif: 1) KTM, 2) KHS terakhir, 3) Foto 3x4. Silakan upload dokumen-dokumen tersebut saat mengajukan.';
      } else if (message.toLowerCase().includes('status') || message.toLowerCase().includes('melacak')) {
        botResponse = 'Anda dapat melacak status pengajuan dengan masuk ke menu Pengajuan → Diajukan. Di sana akan ditampilkan semua riwayat pengajuan beserta statusnya.';
      } else {
        botResponse = 'Maaf, saya belum mengerti pertanyaan Anda. Silakan pilih pertanyaan cepat di bawah atau hubungi admin untuk bantuan lebih lanjut.';
      }

      const botMessage: Message = {
        role: 'bot',
        content: botResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="p-8 font-['Plus_Jakarta_Sans',sans-serif]">
      <h1 className="text-3xl font-bold mb-2">Chatbot Bantuan</h1>
      <p className="text-gray-600 mb-8">Tanyakan apa saja tentang pengajuan surat akademik</p>

      <div className="max-w-4xl mx-auto">
        {/* Chat Container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.role === 'bot' ? 'bg-[#007bff]' : 'bg-gray-600'
                }`}>
                  {message.role === 'bot' ? (
                    <Bot className="text-white" size={20} />
                  ) : (
                    <User className="text-white" size={20} />
                  )}
                </div>
                <div className={`max-w-[70%] ${message.role === 'user' ? 'items-end' : ''}`}>
                  <div className={`rounded-lg p-4 ${
                    message.role === 'bot'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-[#007bff] text-white'
                  }`}>
                    <p>{message.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-2">
                    {message.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Questions */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">Pertanyaan Cepat:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(question)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-100 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ketik pertanyaan Anda..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#007bff] focus:border-transparent"
              />
              <button
                onClick={() => handleSend()}
                className="bg-[#007bff] text-white px-6 py-3 rounded-lg hover:bg-[#0056b3] transition-colors flex items-center gap-2"
              >
                <Send size={20} />
                Kirim
              </button>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Catatan:</strong> Chatbot ini dapat menjawab pertanyaan umum. Untuk pertanyaan khusus atau bantuan lebih lanjut, silakan hubungi admin di <a href="mailto:help@schola.ipb.ac.id" className="underline">help@schola.ipb.ac.id</a>
          </p>
        </div>
      </div>
    </div>
  );
}
