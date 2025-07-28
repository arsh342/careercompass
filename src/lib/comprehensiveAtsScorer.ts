// comprehensiveAtsScorer.ts
// ========================================
// Advanced ATS Score Calculation Algorithm
// ========================================

interface ResumeData {
  skills: string[];
  experience: string[];
  education: string[];
  certifications: string[];
  jobTitles: string[];
  responsibilities: string[];
  achievements: string[];
  keywords: string[];
}

interface JobRequirements {
  requiredSkills: string[];
  preferredSkills: string[];
  experience: string[];
  education: string[];
  certifications: string[];
  responsibilities: string[];
  mustHaveKeywords: string[];
  niceToHaveKeywords: string[];
  jobTitle: string;
  seniority: string;
}

interface ScoringWeights {
  requiredSkills: number;
  preferredSkills: number;
  experience: number;
  education: number;
  certifications: number;
  responsibilities: number;
  jobTitle: number;
  keywordDensity: number;
}

interface DetailedScore {
  overallScore: number;
  categoryScores: {
    requiredSkills: number;
    preferredSkills: number;
    experience: number;
    education: number;
    certifications: number;
    responsibilities: number;
    jobTitle: number;
    keywordDensity: number;
  };
  matched: {
    skills: string[];
    experience: string[];
    education: string[];
    certifications: string[];
    responsibilities: string[];
    keywords: string[];
  };
  missing: {
    criticalSkills: string[];
    preferredSkills: string[];
    certifications: string[];
    experience: string[];
  };
  suggestions: string[];
  confidenceLevel: 'High' | 'Medium' | 'Low';
}

export class ComprehensiveATSScorer {
  private weights: ScoringWeights = {
    requiredSkills: 0.30,
    preferredSkills: 0.15,
    experience: 0.20,
    education: 0.10,
    certifications: 0.05,
    responsibilities: 0.10,
    jobTitle: 0.05,
    keywordDensity: 0.05
  };

  private stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to',
    'was', 'were', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
    'had', 'what', 'said', 'each', 'which', 'she', 'do', 'how', 'their',
    'if', 'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her',
    'would', 'make', 'like', 'into', 'him', 'time', 'two', 'more', 'go',
    'no', 'way', 'could', 'my', 'than', 'first', 'water', 'been', 'call',
    'who', 'oil', 'sit', 'now', 'find', 'long', 'down', 'day', 'did', 'get',
    'come', 'made', 'may', 'part'
  ]);

  // Advanced tokenization with technical term preservation
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\-_]/g, ' ') // Preserve +, #, ., -, _ for tech terms
      .split(/\s+/)
      .filter(word => word.length > 1 && !this.stopWords.has(word))
      .map(word => this.normalizeWord(word));
  }

  private normalizeWord(word: string): string {
    // Handle common technical and education variations
    const techMappings: { [key: string]: string } = {
      'javascript': 'js',
      'typescript': 'ts',
      'reactjs': 'react',
      'nodejs': 'node',
      'vuejs': 'vue',
      'angularjs': 'angular',
      'postgresql': 'postgres',
      'mongodb': 'mongo',
      'mongo': 'mongo',
      'kubernetes': 'k8s',
      'continuous integration': 'ci',
      'continuous deployment': 'cd',
      // Education degree/branch normalization
      'bachelor': 'be', 'bachelors': 'be', 'b.e': 'be', 'be': 'be', 'beng': 'be', 'btech': 'btech', 'b.tech': 'btech',
      'bsc': 'bsc', 'bs': 'bsc', 'msc': 'msc', 'ms': 'msc', 'm.e': 'me', 'me': 'me', 'meng': 'me', 'mtech': 'mtech', 'm.tech': 'mtech',
      'phd': 'phd', 'ph.d': 'phd', 'mba': 'mba', 'bba': 'bba', 'bca': 'bca', 'mca': 'mca', 'bcom': 'bcom', 'b.com': 'bcom',
      'mcom': 'mcom', 'm.com': 'mcom', 'bpharm': 'bpharm', 'b.pharm': 'bpharm', 'mpharm': 'mpharm', 'm.pharm': 'mpharm',
      'mbbs': 'mbbs', 'md': 'md', 'llb': 'llb', 'llm': 'llm', 'ba': 'ba', 'ma': 'ma', 'diploma': 'diploma', 'certificate': 'certificate',
      // Engineering/Science/Other Streams
      'computer': 'cse', 'science': 'cse', 'cse': 'cse', 'ece': 'ece', 'eee': 'eee', 'it': 'it', 'information': 'it', 'technology': 'it',
      'civil': 'civil', 'mechanical': 'mech', 'mech': 'mech', 'electrical': 'electrical', 'electronics': 'ece', 'chemical': 'chemical',
      'biomedical': 'biomedical', 'biotech': 'biotech', 'biotechnology': 'biotech', 'aerospace': 'aerospace', 'automobile': 'automobile',
      'production': 'production', 'structural': 'civil', 'environmental': 'environmental', 'agriculture': 'agri', 'agri': 'agri',
      'commerce': 'commerce', 'business': 'business', 'arts': 'arts', 'law': 'law', 'medicine': 'medicine',
    };
    // Normalize dots and dashes for degree abbreviations
    const cleaned = word.replace(/\./g, '').replace(/-/g, '').toLowerCase();
    return techMappings[cleaned] || cleaned;
  }

  // Semantic similarity using Jaccard similarity
  private calculateSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  // Extract structured data from resume text
  private extractResumeData(resumeText: string): ResumeData {
    const tokens = this.tokenize(resumeText);
    const tokenSet = new Set(tokens);

    // Common skill patterns
    const techSkills = tokens.filter(token => 
      /^(java|python|javascript|react|angular|vue|node|aws|azure|docker|kubernetes|sql|mongo|mongodb|redis|git|ci\/cd|devops|machine learning|ai|blockchain)/.test(token)
    );

    // Extract education keywords (expanded to include abbreviations and variations)
    const educationKeywords = tokens.filter(token =>
      /^(bachelor|master|phd|ph\.d|bs|bsc|ba|ms|msc|ma|mba|beng|be|b\.e|meng|me|m\.e|m\.eng|b\.eng|mtech|btech|b\.tech|m\.tech|associate|as|aa|university|college|engineering|computer|science|cse|ece|eee|it|arts|commerce|business|law|medicine|md|jd|llb|llm|diploma|certificate|degree)/.test(token)
    );

    // Extract certification keywords  
    const certKeywords = tokens.filter(token =>
      /^(aws|azure|google|certified|certification|cissp|cisa|pmp|scrum|agile)/.test(token)
    );

    return {
      skills: techSkills,
      experience: tokens.filter(token => /^(experience|years|worked|developed|managed|led|implemented)/.test(token)),
      education: educationKeywords,
      certifications: certKeywords,
      jobTitles: tokens.filter(token => /^(engineer|developer|manager|architect|analyst|consultant|lead|senior|junior)/.test(token)),
      responsibilities: tokens.filter(token => /^(responsible|managed|developed|implemented|designed|created|built|maintained)/.test(token)),
      achievements: tokens.filter(token => /^(achieved|improved|increased|reduced|optimized|delivered)/.test(token)),
      keywords: [...tokenSet]
    };
  }

  // Parse job description into structured requirements
  private parseJobRequirements(jobDescription: string): JobRequirements {
    const tokens = this.tokenize(jobDescription);
    const text = jobDescription.toLowerCase();


    // Identify required vs preferred skills based on context
    const requiredIndicators = ['required', 'must have', 'essential', 'mandatory', 'minimum'];
    const preferredIndicators = ['preferred', 'nice to have', 'plus', 'bonus', 'desired'];

    const requiredSkills: string[] = [];
    const preferredSkills: string[] = [];

    // Section-based preferred skill extraction
    const jobDescLower = jobDescription.toLowerCase();
    let preferredSectionSkills: string[] = [];
    // Try to extract skills under a 'Preferred' section
    const preferredSectionMatch = jobDescLower.match(/preferred[\s\S]*?(qualifications|skills|requirements)?[:\-\n]+([\s\S]*?)(\n\n|$)/);
    if (preferredSectionMatch && preferredSectionMatch[2]) {
      // Tokenize the section and extract skills
      const sectionTokens = this.tokenize(preferredSectionMatch[2]);
      sectionTokens.forEach(token => {
        if (/^(java|python|javascript|react|angular|vue|node|aws|azure|docker|kubernetes|sql|mongodb|redis|git|ci\/cd|devops|machine learning|ai|blockchain)/.test(token)) {
          preferredSectionSkills.push(token);
        }
      });
    }

    tokens.forEach((token, index) => {
      const context = tokens.slice(Math.max(0, index - 5), index + 5).join(' ');
      const isRequired = requiredIndicators.some(indicator => context.includes(indicator));
      const isPreferred = preferredIndicators.some(indicator => context.includes(indicator));

      if (/^(java|python|javascript|react|angular|vue|node|aws|azure|docker|kubernetes|sql|mongo|mongodb|redis|git|ci\/cd|devops|machine learning|ai|blockchain)/.test(token)) {
        if (isRequired) {
          requiredSkills.push(token);
        } else if (isPreferred) {
          preferredSkills.push(token);
        } else {
          // Default to required if no clear indication
          requiredSkills.push(token);
        }
      }
    });

    // Add section-based preferred skills (avoid duplicates)
    preferredSectionSkills.forEach(skill => {
      if (!preferredSkills.includes(skill)) preferredSkills.push(skill);
      // Remove from requiredSkills if present
      const idx = requiredSkills.indexOf(skill);
      if (idx !== -1) requiredSkills.splice(idx, 1);
    });

    return {
      requiredSkills,
      preferredSkills,
      experience: tokens.filter(token => /^(experience|years|worked)/.test(token)),
    education: tokens.filter(token => /^(bachelor|master|phd|ph\.d|bs|bsc|ba|ms|msc|ma|mba|beng|be|b\.e|meng|me|m\.e|m\.eng|b\.eng|mtech|btech|b\.tech|m\.tech|associate|as|aa|university|college|engineering|computer|science|cse|ece|eee|it|arts|commerce|business|law|medicine|md|jd|llb|llm|diploma|certificate|degree)/.test(token)),
      certifications: tokens.filter(token => /^(aws|azure|google|certified|certification)/.test(token)),
      responsibilities: tokens.filter(token => /^(responsible|manage|develop|implement|design)/.test(token)),
      mustHaveKeywords: requiredSkills,
      niceToHaveKeywords: preferredSkills,
      jobTitle: this.extractJobTitle(jobDescription),
      seniority: this.extractSeniority(jobDescription)
    };
  }

  private extractJobTitle(jobDescription: string): string {
    const titles = ['engineer', 'developer', 'manager', 'architect', 'analyst', 'consultant', 'lead', 'director'];
    const tokens = this.tokenize(jobDescription);
    return tokens.find(token => titles.includes(token)) || '';
  }

  private extractSeniority(jobDescription: string): string {
    const levels = ['junior', 'senior', 'lead', 'principal', 'staff', 'director'];
    const tokens = this.tokenize(jobDescription);
    return tokens.find(token => levels.includes(token)) || 'mid';
  }

  // Calculate individual category scores
  private calculateCategoryScores(resumeData: ResumeData, jobReqs: JobRequirements): any {
    const scores = {
      requiredSkills: 0,
      preferredSkills: 0,
      experience: 0,
      education: 0,
      certifications: 0,
      responsibilities: 0,
      jobTitle: 0,
      keywordDensity: 0
    };

    // Combine all job skills (required + preferred) for matching
    const allJobSkills = [...jobReqs.requiredSkills, ...jobReqs.preferredSkills];
    // Required Skills Score (case-insensitive, robust, match against all job skills)
    if (allJobSkills.length > 0) {
      const norm = (s: string) => s.toLowerCase().replace(/\./g, '').replace(/-/g, '');
      const resumeSkillsNorm = resumeData.skills.map(norm);
      const matchedRequired = allJobSkills.filter(skill => {
        const skillNorm = norm(skill);
        return resumeSkillsNorm.some(resumeSkill => resumeSkill.includes(skillNorm) || skillNorm.includes(resumeSkill));
      });
      scores.requiredSkills = (matchedRequired.length / allJobSkills.length) * 100;
    }

    // Preferred Skills Score (check all job skills against all resume skill-like fields)
    if (allJobSkills.length > 0) {
      const norm = (s: string) => s.toLowerCase().replace(/\./g, '').replace(/-/g, '');
      const allResumeSkillLike = [
        ...resumeData.skills,
        ...resumeData.experience,
        ...resumeData.certifications,
        ...resumeData.keywords
      ];
      const resumeSkillsNorm = allResumeSkillLike.map(norm);
      const matchedPreferred = allJobSkills.filter(skill => {
        const skillNorm = norm(skill);
        return resumeSkillsNorm.some(resumeSkill => resumeSkill.includes(skillNorm) || skillNorm.includes(resumeSkill));
      });
      scores.preferredSkills = (matchedPreferred.length / allJobSkills.length) * 100;
    }

    // Experience Score
    const resumeExpSet = new Set(resumeData.experience);
    const jobExpSet = new Set(jobReqs.experience);
    scores.experience = this.calculateSimilarity(resumeExpSet, jobExpSet) * 100;

    // Education Score (only degree/stream tokens, ignore institution/location)
    const degreeTokens = [
      'be','btech','bsc','bs','ba','bca','bba','bcom','bpharm','mbbs','me','mtech','msc','ms','ma','mba','mca','mcom','mpharm','md','phd','llb','llm','diploma','certificate',
      'cse','ece','eee','it','civil','mech','mechanical','electrical','electronics','chemical','biomedical','biotech','aerospace','automobile','production','structural','environmental','agri','commerce','business','arts','law','medicine','science','technology','computer','information'
    ];
    const filterDegreeTokens = (arr: string[]) => arr.filter(token => degreeTokens.includes(token));
    const resumeEduSet = new Set(filterDegreeTokens(resumeData.education));
    const jobEduSet = new Set(filterDegreeTokens(jobReqs.education));
    scores.education = this.calculateSimilarity(resumeEduSet, jobEduSet) * 100;

    // Certifications Score
    const resumeCertSet = new Set(resumeData.certifications);
    const jobCertSet = new Set(jobReqs.certifications);
    scores.certifications = this.calculateSimilarity(resumeCertSet, jobCertSet) * 100;

    // Responsibilities Score
    const resumeRespSet = new Set(resumeData.responsibilities);
    const jobRespSet = new Set(jobReqs.responsibilities);
    scores.responsibilities = this.calculateSimilarity(resumeRespSet, jobRespSet) * 100;

    // Job Title Score
    scores.jobTitle = resumeData.jobTitles.includes(jobReqs.jobTitle) ? 100 : 0;

    // Keyword Density Score
    const totalJobKeywords = [...jobReqs.mustHaveKeywords, ...jobReqs.niceToHaveKeywords];
    if (totalJobKeywords.length > 0) {
      const matchedKeywords = totalJobKeywords.filter(keyword => 
        resumeData.keywords.includes(keyword)
      );
      scores.keywordDensity = (matchedKeywords.length / totalJobKeywords.length) * 100;
    }

    return scores;
  }

  // Generate improvement suggestions
  private generateSuggestions(resumeData: ResumeData, jobReqs: JobRequirements, scores: any): string[] {
    const suggestions: string[] = [];

    if (scores.requiredSkills < 70) {
      const missingSkills = jobReqs.requiredSkills.filter(skill => 
        !resumeData.skills.some(resumeSkill => 
          resumeSkill.includes(skill) || skill.includes(resumeSkill)
        )
      );
      suggestions.push(`Add missing required skills: ${missingSkills.slice(0, 5).join(', ')}`);
    }

    if (scores.jobTitle < 50) {
      suggestions.push(`Include the job title "${jobReqs.jobTitle}" in your resume`);
    }

    if (scores.keywordDensity < 60) {
      suggestions.push('Increase keyword density by incorporating more job-specific terms from the description');
    }

    if (scores.responsibilities < 50) {
      suggestions.push('Better align your responsibilities with those mentioned in the job description');
    }

    if (scores.certifications < 30 && jobReqs.certifications.length > 0) {
      suggestions.push(`Consider obtaining relevant certifications: ${jobReqs.certifications.slice(0, 3).join(', ')}`);
    }

    return suggestions;
  }

  // Main scoring function
  public calculateComprehensiveScore(resumeText: string, jobDescription: string): DetailedScore {
    const resumeData = this.extractResumeData(resumeText);
    const jobReqs = this.parseJobRequirements(jobDescription);
    const categoryScores = this.calculateCategoryScores(resumeData, jobReqs);

    // Calculate weighted overall score
    const overallScore = Math.round(
      (categoryScores.requiredSkills * this.weights.requiredSkills) +
      (categoryScores.preferredSkills * this.weights.preferredSkills) +
      (categoryScores.experience * this.weights.experience) +
      (categoryScores.education * this.weights.education) +
      (categoryScores.certifications * this.weights.certifications) +
      (categoryScores.responsibilities * this.weights.responsibilities) +
      (categoryScores.jobTitle * this.weights.jobTitle) +
      (categoryScores.keywordDensity * this.weights.keywordDensity)
    );

    // Determine confidence level
    let confidenceLevel: 'High' | 'Medium' | 'Low' = 'Low';
    if (overallScore >= 80) confidenceLevel = 'High';
    else if (overallScore >= 60) confidenceLevel = 'Medium';

    const suggestions = this.generateSuggestions(resumeData, jobReqs, categoryScores);

    return {
      overallScore,
      categoryScores,
      matched: {
        skills: resumeData.skills.filter(skill => 
          [...jobReqs.requiredSkills, ...jobReqs.preferredSkills].some(req => 
            skill.includes(req) || req.includes(skill)
          )
        ),
        experience: resumeData.experience.filter(exp => jobReqs.experience.includes(exp)),
        education: resumeData.education.filter(edu => jobReqs.education.includes(edu)),
        certifications: resumeData.certifications.filter(cert => jobReqs.certifications.includes(cert)),
        responsibilities: resumeData.responsibilities.filter(resp => jobReqs.responsibilities.includes(resp)),
        keywords: resumeData.keywords.filter(keyword => 
          [...jobReqs.mustHaveKeywords, ...jobReqs.niceToHaveKeywords].includes(keyword)
        )
      },
      missing: {
        criticalSkills: jobReqs.requiredSkills.filter(skill => 
          !resumeData.skills.some(resumeSkill => 
            resumeSkill.includes(skill) || skill.includes(resumeSkill)
          )
        ),
        preferredSkills: jobReqs.preferredSkills.filter(skill => 
          !resumeData.skills.some(resumeSkill => 
            resumeSkill.includes(skill) || skill.includes(resumeSkill)
          )
        ),
        certifications: jobReqs.certifications.filter(cert => !resumeData.certifications.includes(cert)),
        experience: jobReqs.experience.filter(exp => !resumeData.experience.includes(exp))
      },
      suggestions,
      confidenceLevel
    };
  }

  // Utility method to customize scoring weights
  public setWeights(newWeights: Partial<ScoringWeights>): void {
    this.weights = { ...this.weights, ...newWeights };
  }
}

// Example usage
export function demonstrateComprehensiveScoring(): void {
  const scorer = new ComprehensiveATSScorer();

  const resumeText = `
    Senior Full Stack Developer with 5+ years of experience in React, Node.js, TypeScript, 
    and AWS. Led development of microservices architecture using Docker and Kubernetes. 
    Implemented CI/CD pipelines with Jenkins. AWS Certified Solutions Architect. 
    Master's degree in Computer Science from Stanford University.
    
    Experience:
    - Developed and maintained React applications serving 100K+ users
    - Built RESTful APIs using Node.js and Express
    - Implemented automated testing with Jest and Cypress
    - Managed AWS infrastructure including EC2, RDS, and Lambda
    - Led a team of 4 developers in agile environment
  `;

  const jobDescription = `
    We are seeking a Senior Software Engineer to join our platform team. 
    
    Required Skills:
    - 3+ years of experience with React and TypeScript
    - Strong knowledge of Node.js and RESTful API development
    - Experience with AWS services (EC2, RDS, Lambda)
    - Proficiency in Docker and containerization
    - Knowledge of CI/CD practices
    
    Preferred Skills:
    - Kubernetes experience
    - AWS certifications
    - Experience with microservices architecture
    - Leadership experience
    
    Responsibilities:
    - Develop and maintain web applications
    - Design and implement APIs
    - Collaborate with cross-functional teams
    - Code review and mentoring junior developers
  `;

  const result = scorer.calculateComprehensiveScore(resumeText, jobDescription);
  
  console.log('\n=== Comprehensive ATS Score Analysis ===');
  console.log(`Overall Score: ${result.overallScore}%`);
  console.log(`Confidence Level: ${result.confidenceLevel}`);
  
  console.log('\n--- Category Breakdown ---');
  Object.entries(result.categoryScores).forEach(([category, score]) => {
    console.log(`${category}: ${Math.round(score)}%`);
  });
  
  console.log('\n--- Matched Elements ---');
  console.log(`Skills: ${result.matched.skills.join(', ')}`);
  console.log(`Keywords: ${result.matched.keywords.slice(0, 10).join(', ')}`);
  
  console.log('\n--- Missing Critical Elements ---');
  console.log(`Critical Skills: ${result.missing.criticalSkills.join(', ')}`);
  
  console.log('\n--- Improvement Suggestions ---');
  result.suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. ${suggestion}`);
  });
}

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstrateComprehensiveScoring();
}
