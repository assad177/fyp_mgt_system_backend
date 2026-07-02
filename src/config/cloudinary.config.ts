import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryConfig = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    return cloudinary.config({
      cloud_name: 'dxticujvp', 
      api_key: '244949815878671',
      api_secret: 'pu_NYofTDoak7_61jcZdIye50KM',
    });
  },
};