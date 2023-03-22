import axios, {
  Axios,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse,
  AxiosResponseHeaders,
  RawAxiosResponseHeaders,
} from 'axios'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36'

export default class HttpClient
  implements Omit<Axios, 'defaults' | 'interceptors'>
{
  private cookies: Record<string, string>

  private readonly axiosInstance: AxiosInstance

  constructor() {
    this.cookies = {}
    this.axiosInstance = axios.create({
      headers: { 'User-Agent': USER_AGENT },
    })

    this.axiosInstance.interceptors.request.use(
      config => {
        config.headers.set('Cookie', this.getCookie())
        return config
      },
      error => Promise.reject(error)
    )

    this.axiosInstance.interceptors.response.use(
      response => {
        this.setCookie(response.headers)
        return response
      },
      error => Promise.reject(error)
    )
  }

  static create(): HttpClient {
    return new this()
  }

  withBaseUrl(baseUrl: string): this {
    this.axiosInstance.defaults.baseURL = baseUrl
    return this
  }

  withUserAgent(userAgent: string): this {
    return this.withHeaders({ 'User-Agent': userAgent } as AxiosRequestHeaders)
  }

  withHeaders(headers: AxiosRequestHeaders): this {
    this.axiosInstance.defaults.headers = {
      ...this.axiosInstance.defaults.headers,
      ...headers,
    }
    return this
  }

  withTimeout(timeout: number): this {
    this.axiosInstance.defaults.timeout = timeout
    return this
  }

  withTimeoutInSeconds(timeout: number): this {
    return this.withTimeout(timeout * 1000)
  }

  private setCookie(
    headers: RawAxiosResponseHeaders | AxiosResponseHeaders
  ): this {
    if ('set-cookie' in headers) {
      const cookieStrings = headers['set-cookie'] as string[]
      cookieStrings.forEach(cookieString => {
        const [nameAndValue, ...rest] = cookieString.split(';')
        const idx = nameAndValue.indexOf('=')
        const name = nameAndValue.substring(0, idx)
        const value = nameAndValue.substring(idx + 1)
        this.cookies[name] = value
      })
    }
    return this
  }

  private getCookie(): string {
    return Object.keys(this.cookies)
      .map(key => {
        return key + '=' + this.cookies[key]
      })
      .join(';')
  }

  withCookies(cookies: Record<string, string>): this {
    Object.keys(cookies).forEach(key => {
      const value = cookies[key]
      this.cookies[key] = value
    })
    return this
  }

  withCookie(name: string, value: string): this {
    this.cookies[name] = value
    return this
  }

  getCookies(): Record<string, string> {
    return this.cookies
  }

  getUri(config?: AxiosRequestConfig): string {
    return this.axiosInstance.getUri(config)
  }

  async request<T = any, R = AxiosResponse<T>, D = any>(
    config: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.request(config)
  }

  async get<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.get(url, config)
  }

  async delete<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.delete(url, config)
  }

  async head<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.head(url, config)
  }

  async options<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.options(url, config)
  }

  async post<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.post(url, data, config)
  }

  async put<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.put(url, data, config)
  }

  async patch<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.patch(url, data, config)
  }

  async postForm<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.postForm(url, data, config)
  }

  async putForm<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.putForm(url, data, config)
  }

  async patchForm<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig<D>
  ): Promise<R> {
    return this.axiosInstance.patchForm(url, data, config)
  }
}

const httpClient = new HttpClient()

export { httpClient }
