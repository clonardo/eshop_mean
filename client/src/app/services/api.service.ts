import { WindowService } from './window.service';
import { map } from 'rxjs/operators';
import { Inject, Injectable, Injector, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { REQUEST } from '@nguniversal/express-engine/tokens';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { FileUploader } from 'ng2-file-upload';
import { Observable, BehaviorSubject} from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  apiUrl = environment.apiUrl;
  uploaderSub : BehaviorSubject<FileUploader> = new BehaviorSubject(null);

  constructor(
      private readonly http     : HttpClient,
      private readonly _injector: Injector,
      private readonly _window  : WindowService,
      @Inject(PLATFORM_ID)
      private _platformId       : Object
      ) {

    if (environment.production) {
      if (isPlatformServer(this._platformId)) {
        const serverRequest = REQUEST ? this._injector.get(REQUEST) : '';
        this.apiUrl = serverRequest ? `${serverRequest.protocol}://${serverRequest.get('Host')}` : '';
      }

      if (isPlatformBrowser(this._platformId)) {
        this.apiUrl = this._window.location.origin || '';
      }
    }
  }

  // auth
  getUser() {
    const userUrl = this.apiUrl + '/api/auth';
    return this.http.get(userUrl);
  }

  // orders
  handleToken(token) {
    const tokenUrl = this.apiUrl + '/api/orders/stripe';
    return this.http.post(tokenUrl, token);
  };

  makeOrder(req) {
    const addOrder = this.apiUrl + '/api/orders/add';
    return this.http.post(addOrder, req);
  }

  sendContact(req) {
    const sendContact = this.apiUrl + '/api/eshop/contact';
    return this.http.post(sendContact, req);
  }

  signIn(req) {
    const sendContact = this.apiUrl + '/api/auth/signin';
    return this.http.post(sendContact, req);
  }

  signUp(req) {
    const sendContact = this.apiUrl + '/api/auth/signup';
    return this.http.post(sendContact, req);
  }


  loadProducts(req) {
    const {lang, page, sort, category} = req;
    const addCategory = category ? {category} : {};
    const categoryQuery = category ? '&category=' + category : '';
    const productsUrl = this.apiUrl + '/api/products?lang=' + lang + '&page=' + page + '&sort=' + sort + categoryQuery;
    return this.http.get(productsUrl).pipe(map((data: any) => ({
        products : data.all
          .map(product => ({...product,
              categories: product.categories.filter(Boolean).map(category => category.toLowerCase()),
              tags: product.tags.map(tag => tag ? tag.toLowerCase() : '')})),
        pagination: {
          limit: data.limit,
          page: data.page,
          pages: data.pages,
          total: data.total,
          range: Array(data.pages).fill(0).map((v, i) => i + 1)
        },
        ...addCategory
    })))
  }


  loadCategories(payload) {
    const categoriesUrl = this.apiUrl + '/api/products/categories?lang=' + payload.lang;
    return this.http.get(categoriesUrl)
  }

  loadProductsSearch(query: string) {
    const productUrl = this.apiUrl + '/api/products/search?query=' + query;
    return this.http.get(productUrl);
  }

  getProduct(params) {
    const productUrl = this.apiUrl + '/api/products/' + params;
    return this.http.get(productUrl);
  }

  addProduct(product) {
    const addProduct = this.apiUrl + '/api/products/add';
    return this.http.post(addProduct, product);
  }

  editProduct(product) {
    const eidtProduct = this.apiUrl + '/api/products/edit';
    return this.http.patch(eidtProduct, product);
  }

  removeProduct(name: string) {
    const removeProduct = this.apiUrl + '/api/products/' + name;
    return this.http.delete(removeProduct);
  }


  getUserOrders(req) {
    const userOrderUrl = this.apiUrl + '/api/orders';
    return this.http.post(userOrderUrl, req);
  }

  getOrders() {
    const ordersUrl = this.apiUrl + '/api/orders/all';
    return this.http.get(ordersUrl);
  }

  getOrder(id: string) {
    const orderUrl = this.apiUrl + '/api/orders/' + id;
    return this.http.get(orderUrl);
  }

  updateOrder(req) {
    const orderUpdateUrl = this.apiUrl + '/api/orders';
    return this.http.patch(orderUpdateUrl, req);
  }

  getStripeSession(req) {
    const stripeSessionUrl = this.apiUrl + '/api/orders/stripe/session';
    return this.http.post(stripeSessionUrl, req);
  }

  // cart
  getCart() {
    const cartUrl = this.apiUrl + '/api/cart/';
    return this.http.get(cartUrl);
  }

  addToCart(params: string) {
    const addToCartUrl = this.apiUrl + '/api/cart/add' + params;
    return this.http.get(addToCartUrl);
  }

  removeFromCart(params: string) {
    const removeFromCartUrl = this.apiUrl + '/api/cart/remove' + params;
    return this.http.get(removeFromCartUrl);
  }


  getLangTranslations(lang) {
    const translationsUrl = this.apiUrl + '/api/translations?lang=' + lang;
    return this.http.get(translationsUrl);
  }

  getAllTranslations() {
    const translationsUrl = this.apiUrl + '/api/translations/all';
    return this.http.get(translationsUrl);
  }

  editTranslation({lang, keys}) {
    const translationsUpdateUrl = this.apiUrl + '/api/translations?lang=' + lang;
    return this.http.patch(translationsUpdateUrl, { keys : keys });
  }



  getImages() {
    const getImages = this.apiUrl + '/api/admin/images';
    return this.http.get(getImages);
  }

  addProductImagesUrl({image, titleUrl}) {
    const titleUrlQuery = titleUrl ? '?titleUrl=' + titleUrl : '';
    const addImageUrl = this.apiUrl + '/api/admin/images/add' + titleUrlQuery;
    return this.http.post(addImageUrl, { image });
  }

  removeImage({image, titleUrl}) {
    const titleUrlQuery = titleUrl ? '?titleUrl=' + titleUrl : '';
    const removeImage = this.apiUrl + '/api/admin/images/remove' + titleUrlQuery;
    return this.http.post(removeImage, { image });
  }

  getUploader() {
    return this.uploaderSub.asObservable();
  }

  setUploader({options, titleUrl}): Observable<any> {
    if (isPlatformBrowser(this._platformId)) {
      const titleUrlQuery = titleUrl ? '?titleUrl=' + titleUrl : '';
      const accessToken = localStorage.getItem('accessToken');
      const authorizationHeader = accessToken ? {name: 'Authorization', value: 'Bearer ' + accessToken } : {};

      this.uploaderSub.next(new FileUploader({
        url: this.apiUrl + '/api/admin/images/upload' + titleUrlQuery,
        headers: [{name: 'Accept', value: 'application/json', ...authorizationHeader}],
        ...options
    }));

    return this.uploaderSub.asObservable();
    }
  }

  getLocation$() {
    const locationFindUrl = 'https://ipinfo.io';
    return this.http.get(locationFindUrl)
      .pipe(map((response: any ) => {
        const country = response.country ? response.country.toLowerCase() : '';
        if (country === 'sk') {
          return country;
        } else if (country === 'cz') {
          return 'cs';
        } else {
          return 'en';
        }

      }))
  }


}
