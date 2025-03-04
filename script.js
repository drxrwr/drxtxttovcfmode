document.getElementById('processButton').addEventListener('click', () => {
    const files = document.getElementById('fileInput').files;
    const mode = document.getElementById('modeSelect').value;
    const contactName = document.getElementById('contactName').value.trim();
    const fileList = document.getElementById('fileList');
    fileList.innerHTML = '';

    if (files.length === 0) {
        alert('Silakan unggah file terlebih dahulu.');
        return;
    }

    if (!contactName) {
        alert('Nama kontak tidak boleh kosong.');
        return;
    }

    Array.from(files).forEach(file => {
        const listItem = document.createElement('div');
        listItem.classList.add('file-item');
        const fileName = file.name;
        const [namePart] = fileName.match(/(.+)(\.[^.]+$)/).slice(1); 
        let newFileName = '';

        try {
            // Proses nama file berdasarkan mode
            if (mode === 'fileName') {
                newFileName = `${namePart}.vcf`;
            } else if (mode === 'inBrackets') {
                const match = namePart.match(/(.*?)/);
                if (match) {
                    newFileName = `${match[1]}.vcf`;
                } else {
                    throw new Error('Tidak ada tanda kurung dalam nama file.');
                }
            } else if (mode.startsWith('last')) {
                const charCount = parseInt(mode.replace('last', ''), 10);
                if (isNaN(charCount) || charCount <= 0) {
                    throw new Error('Jumlah karakter terakhir harus valid.');
                }
                if (namePart.length >= charCount) {
                    newFileName = `${namePart.slice(-charCount)}.vcf`;
                } else {
                    throw new Error('Jumlah karakter melebihi panjang nama file.');
                }
            } else {
                throw new Error('Mode tidak dikenal.');
            }

            // Proses file menjadi VCF
            generateDownloadLink(file, newFileName, contactName, listItem);

        } catch (error) {
            listItem.classList.add('error');
            listItem.innerHTML = `<span>${fileName}</span><span class="error-msg">${error.message}</span>`;
        }

        fileList.appendChild(listItem);
    });
});

function generateDownloadLink(file, newFileName, contactName, listItem) {
    const reader = new FileReader();
    reader.onload = () => {
        const txtContent = reader.result;
        let localCounter = 1;
        let currentCategory = 'Anggota';

        const vcfContent = txtContent
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
                let contact = line.trim();

                // Menambahkan "+" jika belum ada
                if (!contact.startsWith('+')) {
                    contact = '+' + contact;
                }

                const newCategory = classifyContact(contact);
                if (newCategory) {
                    currentCategory = newCategory;
                    localCounter = 1;
                }

                if (/^\+\d+$/.test(contact)) {
                    const contactFullName = `${contactName} ${localCounter}`;
                    const fullContactName = currentCategory === 'Anggota' ? contactFullName : `${contactFullName} (${currentCategory})`;
                    const contactVcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${fullContactName}\nTEL:${contact}\nEND:VCARD\n`;
                    localCounter++;
                    return contactVcard;
                } else {
                    return '';
                }
            })
            .join('\n');

        const blob = new Blob([vcfContent], { type: 'text/vcard' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = newFileName;
        link.textContent = `Unduh ${newFileName}`;
        link.classList.add('download-link');
        listItem.appendChild(link);
        listItem.classList.add('success');
        listItem.innerHTML += `<span> → Tautan tersedia untuk diunduh</span>`;
    };
    reader.readAsText(file);
}

// Fungsi untuk mengklasifikasikan kontak
function classifyContact(contact) {
    if (contact.match(/管理号|管理|管理员|admin|Admin/)) {
        return 'Admin';
    } else if (contact.match(/水軍|小号|水军|navy|Navy/)) {
        return 'Navy';
    } else if (contact.match(/数据|客户|底料|进群资源|资料|Anggota/)) {
        return 'Anggota';
    } else {
        return null;
    }
            }
