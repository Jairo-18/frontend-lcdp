import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ImageVariant } from '@shared/interfaces/image-variant.interface';
import { UploadFolder } from '@shared/interfaces/upload.interface';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly _http: HttpClient = inject(HttpClient);

  uploadImages(
    folder: UploadFolder,
    files: File[],
  ): Observable<ImageVariant[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return this._http
      .post<{
        statusCode: number;
        data: { images: ImageVariant[] };
      }>(`${environment.apiUrl}/uploads/${folder}`, formData)
      .pipe(map((r) => r.data.images));
  }
}
