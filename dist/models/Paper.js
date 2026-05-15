/**
 * 统一的学术论文数据模型
 * 支持多个学术平台的标准化数据格式
 */
/**
 * Paper工厂类，用于创建和验证Paper对象
 */
export class PaperFactory {
    /**
     * 创建Paper对象
     */
    static create(data) {
        return {
            paperId: data.paperId,
            title: data.title,
            authors: data.authors || [],
            abstract: data.abstract || '',
            doi: data.doi || '',
            publishedDate: data.publishedDate || null,
            pdfUrl: data.pdfUrl || '',
            url: data.url || '',
            source: data.source,
            updatedDate: data.updatedDate,
            categories: data.categories || [],
            keywords: data.keywords || [],
            citationCount: data.citationCount || 0,
            references: data.references || [],
            journal: data.journal,
            volume: data.volume,
            issue: data.issue,
            pages: data.pages,
            year: data.year,
            extra: data.extra || {}
        };
    }
    /**
     * 将Paper对象转换为字典格式（用于序列化）
     */
    static toDict(paper) {
        return {
            paper_id: paper.paperId,
            title: paper.title,
            authors: paper.authors.join('; '),
            abstract: paper.abstract,
            doi: paper.doi,
            published_date: paper.publishedDate?.toISOString() || '',
            pdf_url: paper.pdfUrl,
            url: paper.url,
            source: paper.source,
            updated_date: paper.updatedDate?.toISOString() || '',
            categories: paper.categories?.join('; ') || '',
            keywords: paper.keywords?.join('; ') || '',
            citation_count: paper.citationCount || 0,
            references: paper.references?.join('; ') || '',
            journal: paper.journal || '',
            volume: paper.volume || '',
            issue: paper.issue || '',
            pages: paper.pages || '',
            year: paper.year || null,
            extra: JSON.stringify(paper.extra || {})
        };
    }
    /**
     * 验证Paper对象是否有效
     */
    static validate(paper) {
        return !!(paper.paperId && paper.title && paper.source);
    }
}
//# sourceMappingURL=Paper.js.map