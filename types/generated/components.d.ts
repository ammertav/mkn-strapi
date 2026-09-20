import type { Schema, Struct } from '@strapi/strapi';

export interface BeritaGaleriItem extends Struct.ComponentSchema {
  collectionName: 'components_berita_galeri_items';
  info: {
    displayName: 'Galeri Item';
    icon: 'book';
  };
  attributes: {
    gambar: Schema.Attribute.Media<'images' | 'files'>;
    keterangan: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
  };
}

export interface BeritaSumber extends Struct.ComponentSchema {
  collectionName: 'components_berita_sumbers';
  info: {
    displayName: 'Sumber';
  };
  attributes: {
    nama: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'berita.galeri-item': BeritaGaleriItem;
      'berita.sumber': BeritaSumber;
    }
  }
}
