import favicon from './extensions/favicon.png';
import logo from './extensions/logo-unissula-crest.png';

const NAMA_CMS = 'CMS MKn UNISSULA';

const config = {
  auth: {
    logo,
  },
  menu: {
    logo,
  },
  translations: {
    en: {
      'Auth.form.welcome.title': `Welcome to ${NAMA_CMS}`,
      'Auth.form.welcome.subtitle': 'Magister Kenotariatan Fakultas Hukum UNISSULA',
      'Auth.form.register.subtitle':
        'Credentials are only used to authenticate in this CMS. All saved data will be stored in your database.',
      'app.components.LeftMenu.navbrand.title': NAMA_CMS,
      'app.components.LeftMenu.navbrand.workplace': 'Magister Kenotariatan',
      'Settings.permissions.users.listview.header.subtitle': `All the users who have access to the ${NAMA_CMS} admin panel`,
    },
  },
};

// Strapi menulis judul tab sebagai "<halaman> | Strapi" tanpa opsi konfigurasi,
// jadi akhiran itu diganti setiap kali judul berubah.
const gantiJudulTab = () => {
  const ganti = () => {
    const judul = document.title
      .replace(/\| Strapi$/, `| ${NAMA_CMS}`)
      .replace(/^Strapi Admin$/, NAMA_CMS);

    if (judul !== document.title) {
      document.title = judul;
    }
  };

  ganti();
  new MutationObserver(ganti).observe(document.head, {
    subtree: true,
    childList: true,
    characterData: true,
  });
};

// Halaman admin tidak punya <link rel="icon">, jadi browser jatuh ke /favicon.ico
// yang di-cache lama. URL aset ber-hash ini memaksa browser memakai favicon baru.
const pasangFavicon = () => {
  document.querySelectorAll('link[rel~="icon"]').forEach((el) => el.remove());

  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/png';
  link.href = favicon;
  document.head.appendChild(link);
};

const bootstrap = () => {
  pasangFavicon();
  gantiJudulTab();
};

export default {
  config,
  bootstrap,
};
