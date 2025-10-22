export default function Disclaimer() {
  return (
    <section className="bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ⚠️ Important Disclaimer
            </h2>
          </div>
          
          <div className="prose prose-lg mx-auto text-gray-700">
            <p className="mb-4">
              <strong>YallaFoot</strong> is a platform that curates and reviews streaming links submitted by our community. 
              We do not host, store, or provide any streaming content ourselves.
            </p>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
              <p className="text-yellow-800">
                <strong>Legal Notice:</strong> We are not responsible for the content, quality, legality, 
                or availability of any external streaming links. Users access these links at their own risk 
                and discretion.
              </p>
            </div>
            
            <ul className="list-disc pl-6 space-y-2">
              <li>All streaming links are provided by third-party users and sources</li>
              <li>We do not verify the legality of streaming content in your jurisdiction</li>
              <li>Users are responsible for ensuring compliance with local laws and regulations</li>
              <li>We recommend using official broadcasters and legal streaming services when available</li>
              <li>YallaFoot does not endorse or guarantee the safety of external websites</li>
            </ul>
            
            <p className="mt-6 text-sm text-gray-600">
              By using our platform, you acknowledge that you understand and accept these terms. 
              If you believe any content violates copyright or other laws, please contact us immediately.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}